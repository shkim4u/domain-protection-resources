import {DomainProtectionStackProps} from './props';
import {aws_events_targets, Duration, Stack} from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as events from 'aws-cdk-lib/aws-events'
import {RuleProps, Schedule} from "aws-cdk-lib/aws-events";
import * as targets from 'aws-cdk-lib/aws-events-targets'
import * as lambda from 'aws-cdk-lib/aws-lambda'

interface DomainProtectionEventRuleProps extends RuleProps {
  id: string;
};

export class EventsStack extends Stack {
  constructor(
    scope: Construct,
    id: string,
    props: DomainProtectionStackProps,
    accountsLambdaFunction: lambda.Function,
    currentLambdaFunction: lambda.Function,
    resourcesLambdaFunction: lambda.Function,
    statsLambdaFunction: lambda.Function,
    updateLambdaFunction: lambda.Function
  ) {
    super(scope, id, props);

    // Setup parameters for each EventBridge schedule rule.
    const ruleProps: DomainProtectionEventRuleProps[] = [
      // 1. Rule to trigger "Accounts" lambda function.
      {
        id: `${props.project}-accounts-event-rule`,
        ruleName: `${props.project}-accounts-event-rule`,
        description: `Triggers ${props.project} lambda functions to schedule {Accounts}`,
        targets: [new targets.LambdaFunction(accountsLambdaFunction)],
        schedule: Schedule.rate(Duration.minutes(1)),
        enabled: true
      },
      // 2. Rule to trigger "Current" lambda function.
      {
        id: `${props.project}-current-event-rule`,
        ruleName: `${props.project}-current-event-rule`,
        description: `Triggers ${props.project} lambda functions to schedule {Current}`,
        targets: [new targets.LambdaFunction(currentLambdaFunction)],
        // [2022-09-27] Changed to "cron" from "rate"
        // schedule: Schedule.rate(Duration.hours(24)),
        schedule: Schedule.cron(
          {
            year: '*',
            // weekDay: '?',
            month: '*',
            day: '*',
            hour: '0',
            minute: '0'
          }
        ),
        enabled: true
      },
      // 3. Rule to trigger "Resources" lambda function.
      {
        id: `${props.project}-resources-event-rule`,
        ruleName: `${props.project}-resources-event-rule`,
        description: `Triggers ${props.project} lambda functions to schedule {Resources}`,
        targets: [new targets.LambdaFunction(resourcesLambdaFunction)],
        // [2022-09-27] Changed to "cron" from "rate"
        // schedule: Schedule.rate(Duration.hours(24)),
        schedule: Schedule.cron(
          {
            year: '*',
            // weekDay: '?',
            month: '*',
            day: '*',
            hour: '0',
            minute: '10'
          }
        ),
        enabled: true
      },
      // 4. Rule to trigger "Stats" lambda function.
      {
        id: `${props.project}-stats-event-rule`,
        ruleName: `${props.project}-stats-event-rule`,
        description: `Trigger ${props.project} lambda function to schedule {Stats}`,
        targets: [new targets.LambdaFunction(statsLambdaFunction)],
        // schedule: Schedule.expression('0 0 1 * ? *'),
        schedule: Schedule.cron(
          {
            year: '*',
            // weekDay: '?',
            month: '*',
            day: '1',
            hour: '0',
            minute: '0'
          }
        ),
        enabled: true
      },
      // 5. Rule to trigger "Update" lambda function.
      {
        id: `${props.project}-update-event-rule`,
        ruleName: `${props.project}-update-event-rule`,
        description: `Trigger ${props.project} lambda function to schedule {Update}`,
        targets: [new targets.LambdaFunction(updateLambdaFunction)],
        schedule: Schedule.rate(Duration.hours(1)),
        enabled: true
      }
    ];

    ruleProps.forEach(
      ruleProp => {
        new events.Rule(
          this,
          ruleProp.id,
          {
            ruleName: ruleProp.ruleName,
            description: ruleProp.description,
            targets: ruleProp.targets,
            schedule: ruleProp.schedule,
            enabled: ruleProp.enabled
          }
        );
      }
    );
  }
}
