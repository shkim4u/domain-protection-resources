import {DomainProtectionStackProps} from './props';
import {Duration, Stack} from 'aws-cdk-lib';
import {Construct} from 'constructs';
import * as stepfunctions from 'aws-cdk-lib/aws-stepfunctions'
import {LogLevel, StateMachineType} from 'aws-cdk-lib/aws-stepfunctions'
import * as tasks from 'aws-cdk-lib/aws-stepfunctions-tasks';
import * as lambda from 'aws-cdk-lib/aws-lambda'
import * as logs from 'aws-cdk-lib/aws-logs'
import {RetentionDays} from 'aws-cdk-lib/aws-logs'
import * as iam from "aws-cdk-lib/aws-iam";
import * as fs from 'fs';

export class StepFunctionsStack extends Stack {
  constructor(scope: Construct, id: string, props: DomainProtectionStackProps, lambdaFunction: lambda.Function) {
    super(scope, id, props);

    const scanStateMachinePermissionPolicy = new iam.Policy(
      this,
      'domain-protection-scan-statemachine-permission-policy',
      {
        policyName: 'domain-protection-scan-statemachine-permission-policy',
        document: iam.PolicyDocument.fromJson(
          JSON.parse(fs.readFileSync('resources/iam/policy/domain-protection-scan-statemachine-permission-policy.json', 'utf8'))
        )
      }
    );

    const scanStateMachineRole = new iam.Role(
      this,
      'domain-protection-scan-statemachine-role',
      {
        assumedBy: new iam.ServicePrincipal('states.amazonaws.com'),
        roleName: 'domain-protection-scan-statemachine-role',
        maxSessionDuration: Duration.seconds(3600)
      }
    );
    scanStateMachineRole.attachInlinePolicy(scanStateMachinePermissionPolicy);


    const scanLogGroup = new logs.LogGroup(
      this,
      'ScanLogGroup',
      {
        logGroupName: "/aws/vendedlogs/states/domain-protection-scan",
        retention: RetentionDays.THREE_MONTHS
      }
    );

    const scanStateMachine = new stepfunctions.StateMachine(
      this,
      'domain-protection-scan-stepfunctions',
      {
        stateMachineName: 'domain-protection-scan',
        stateMachineType: StateMachineType.STANDARD,
        definition: stepfunctions.Chain.start(
          new stepfunctions.Map(
            this,
            'ListAccounts'
          ).iterator(
            new tasks.LambdaInvoke(
              this,
              'ScanAccounts',
              {
                lambdaFunction: lambdaFunction
              }
            )
          )
        ),
        role: scanStateMachineRole,
        logs: {
          destination: scanLogGroup,
          includeExecutionData: true,
          level: LogLevel.ALL
        }
      }
    );
  }
}
