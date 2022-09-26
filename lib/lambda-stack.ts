import {DomainProtectionStackProps} from './props';
import {Duration, Stack} from 'aws-cdk-lib';
import {Construct} from 'constructs';
import * as iam from 'aws-cdk-lib/aws-iam'
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import * as path from 'path';
import * as fs from 'fs';

export class LambdaStack extends Stack {
  public readonly scanLambdaFunction: lambda.Function;
  public readonly accountsLambdaFunction: lambda.Function;
  public readonly currentLambdaFunction: lambda.Function;
  public readonly resourcesLambdaFunction: lambda.Function;
  public readonly statsLambdaFunction: lambda.Function;
  public readonly updateLambdaFunction: lambda.Function;
  public readonly takeoverLambdaFunction: lambda.Function;
  public readonly notifyLambdaFunction: lambda.Function;

  constructor(scope: Construct, id: string, props: DomainProtectionStackProps, snsTopic: sns.Topic) {
    super(scope, id, props);

    const lambdaBaseDir = path.join(__dirname, "../lambda");

    // Lambda layer for utils.
    const lambdaLayer = new lambda.LayerVersion(
      this,
      'domain-protection-lambda-layer',
      {
        description: 'Domain protection Lambda layer',
        code: lambda.Code.fromAsset(`${lambdaBaseDir}/layers`),
        compatibleRuntimes: [lambda.Runtime.PYTHON_3_9]
      }
    );

    /***********************************************************
     * Lambda Function - 1. Accounts
     ***********************************************************/
    const accountsLambdaFunctionPermissionPolicy = new iam.Policy(
      this,
      'domain-protection-accounts-lambda-permission-policy',
      {
        policyName: 'domain-protection-accounts-lambda-permission-policy',
        document: iam.PolicyDocument.fromJson(
          JSON.parse(fs.readFileSync('resources/iam/policy/domain-protection-accounts-lambda-permission-policy.json', 'utf8'))
        )
      }
    );

    const accountsLambdaFunctionRole = new iam.Role(
      this,
      'domain-protection-accounts-lambda-role',
      {
        assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
        roleName: 'domain-protection-accounts-lambda-role',
        maxSessionDuration: Duration.seconds(3600)
      }
    );
    accountsLambdaFunctionRole.attachInlinePolicy(accountsLambdaFunctionPermissionPolicy);

    // Lambda function - domain protection accounts.
    this.accountsLambdaFunction = new lambda.Function(
      this,
      'domain-protection-accounts-lambda-function',
      {
        functionName: 'domain-protection-accounts-lambda-function',
        description: 'Domain protection Lambda function for accounts',
        runtime: lambda.Runtime.PYTHON_3_9,
        code: lambda.Code.fromAsset(
          `${lambdaBaseDir}/accounts`,
          {
            bundling: {
              image: lambda.Runtime.PYTHON_3_9.bundlingImage,
              command: [
                'bash', '-c',
                'pip install -r requirements.txt -t /asset-output && cp -au . /asset-output'
              ],
            }
          }
        ),
        handler: 'accounts.lambda_handler',
        layers: [lambdaLayer],
        role: accountsLambdaFunctionRole,
        timeout: Duration.seconds(900),
        environment: {
          'ORGANIZATION_PRIMARY_ACCOUNT': props.organization_primary_account,
          'SECURITY_AUDIT_ROLE_NAME': props.security_audit_role_name,
          'PROJECT': props.project,
          'SNS_TOPIC_ARN': snsTopic.topicArn,
          // Need to predefine state machine ARN to prevent cyclic reference.
          'STATE_MACHINE_ARN': `arn:aws:states:ap-northeast-2:${props.env?.account}:stateMachine:domain-protection-scan`,
          'EXTERNAL_ID': props.external_id
        },
      }
    );

    /***********************************************************
     * End of Lambda Function - 1. Accounts
     ***********************************************************/


    /***********************************************************
     * Lambda Function - 2. Scan
     ***********************************************************/
    const scanLambdaFunctionPermissionPolicy = new iam.Policy(
      this,
      'domain-protection-scan-lambda-permission-policy',
      {
        policyName: 'domain-protection-scan-lambda-permission-policy',
        document: iam.PolicyDocument.fromJson(
          JSON.parse(fs.readFileSync('resources/iam/policy/domain-protection-scan-lambda-permission-policy.json', 'utf8'))
        )
      }
    );

    const scanLambdaFunctionRole = new iam.Role(
      this,
      'domain-protection-scan-lambda-role',
      {
        assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
        roleName: 'domain-protection-scan-lambda-role',
        maxSessionDuration: Duration.seconds(3600)
      }
    );
    scanLambdaFunctionRole.attachInlinePolicy(scanLambdaFunctionPermissionPolicy);

    // Lambda function - domain protection scan.
    this.scanLambdaFunction = new lambda.Function(
      this,
      'domain-protection-scan-lambda-function',
      {
        functionName: 'domain-protection-scan-lambda-function',
        description: 'Domain protection Lambda function for scanning',
        runtime: lambda.Runtime.PYTHON_3_9,
        code: lambda.Code.fromAsset(
          `${lambdaBaseDir}/scan`,
          {
            bundling: {
              image: lambda.Runtime.PYTHON_3_9.bundlingImage,
              command: [
                'bash', '-c',
                'pip install -r requirements.txt -t /asset-output && cp -au . /asset-output'
              ],
            }
          }
        ),
        handler: 'scan.lambda_handler',
        layers: [lambdaLayer],
        role: scanLambdaFunctionRole,
        timeout: Duration.seconds(900),
        environment: {
          'ORGANIZATION_PRIMARY_ACCOUNT': props.organization_primary_account,
          'SECURITY_AUDIT_ROLE_NAME': props.security_audit_role_name,
          'PROJECT': props.project,
          'SNS_TOPIC_ARN': snsTopic.topicArn,
          'EXTERNAL_ID': props.external_id
        },
      }
    );

    /***********************************************************
     * End of Lambda Function - 2. Scan
     ***********************************************************/

    /***********************************************************
     * Lambda Function - 3. Self Takeover
     ***********************************************************/
    const takeoverLambdaFunctionPermissionPolicy = new iam.Policy(
      this,
      'domain-protection-takeover-lambda-permission-policy',
      {
        policyName: 'domain-protection-takeover-lambda-permission-policy',
        document: iam.PolicyDocument.fromJson(
          JSON.parse(fs.readFileSync('resources/iam/policy/domain-protection-takeover-lambda-permission-policy.json', 'utf8'))
        )
      }
    );

    const takeoverLambdaFunctionRole = new iam.Role(
      this,
      'domain-protection-takeover-lambda-role',
      {
        assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
        roleName: 'domain-protection-takeover-lambda-role',
        maxSessionDuration: Duration.seconds(3600)
      }
    );
    takeoverLambdaFunctionRole.attachInlinePolicy(takeoverLambdaFunctionPermissionPolicy);
    takeoverLambdaFunctionRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonS3FullAccess'));
    takeoverLambdaFunctionRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonVPCFullAccess'));
    takeoverLambdaFunctionRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AdministratorAccess-AWSElasticBeanstalk'));
    takeoverLambdaFunctionRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AWSCloudFormationFullAccess'));

    // Lambda function - domain protection take over.
    this.takeoverLambdaFunction = new lambda.Function(
      this,
      'domain-protection-takeover-lambda-function',
      {
        functionName: 'domain-protection-takeover-lambda-function',
        description: 'Domain protection Lambda function for taking over vulnerable resources',
        runtime: lambda.Runtime.PYTHON_3_9,
        code: lambda.Code.fromAsset(
          `${lambdaBaseDir}/takeover`,
          {
            bundling: {
              image: lambda.Runtime.PYTHON_3_9.bundlingImage,
              command: [
                'bash', '-c',
                'pip install -r requirements.txt -t /asset-output && cp -au . /asset-output'
              ],
            }
          }
        ),
        handler: 'takeover.lambda_handler',
        layers: [lambdaLayer],
        role: takeoverLambdaFunctionRole,
        timeout: Duration.seconds(900),
        environment: {
          'ORGANIZATION_PRIMARY_ACCOUNT': props.organization_primary_account,
          'PROJECT': props.project,
          'SNS_TOPIC_ARN': snsTopic.topicArn,
          'SUFFIX': 'abracada'
        },
      }
    );
    snsTopic.addSubscription(new subscriptions.LambdaSubscription(this.takeoverLambdaFunction));

    /***********************************************************
     * End of Lambda Function - 3. Self Takeover
     ***********************************************************/

    /***********************************************************
     * Lambda Function - 4. Send stats to SNS.
     ***********************************************************/
    const statsLambdaFunctionPermissionPolicy = new iam.Policy(
      this,
      'domain-protection-stats-lambda-permission-policy',
      {
        policyName: 'domain-protection-stats-lambda-permission-policy',
        document: iam.PolicyDocument.fromJson(
          JSON.parse(fs.readFileSync('resources/iam/policy/domain-protection-stats-lambda-permission-policy.json', 'utf8'))
        )
      }
    );

    const statsLambdaFunctionRole = new iam.Role(
      this,
      'domain-protection-stats-lambda-role',
      {
        assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
        roleName: 'domain-protection-stats-lambda-role',
        maxSessionDuration: Duration.seconds(3600)
      }
    );
    statsLambdaFunctionRole.attachInlinePolicy(statsLambdaFunctionPermissionPolicy);

    // Lambda function - domain protection stats to send to SNS.
    this.statsLambdaFunction = new lambda.Function(
      this,
      'domain-protection-stats-lambda-function',
      {
        functionName: 'domain-protection-stats-lambda-function',
        description: 'Domain protection Lambda function for sending stats to SNS',
        runtime: lambda.Runtime.PYTHON_3_9,
        code: lambda.Code.fromAsset(
          `${lambdaBaseDir}/stats`,
          {
            bundling: {
              image: lambda.Runtime.PYTHON_3_9.bundlingImage,
              command: [
                'bash', '-c',
                'pip install -r requirements.txt -t /asset-output && cp -au . /asset-output'
              ],
            }
          }
        ),
        handler: 'stats.lambda_handler',
        layers: [lambdaLayer],
        role: scanLambdaFunctionRole,
        timeout: Duration.seconds(900),
        environment: {
          'ORGANIZATION_PRIMARY_ACCOUNT': props.organization_primary_account,
          'SECURITY_AUDIT_ROLE_NAME': props.security_audit_role_name,
          'PROJECT': props.project,
          'SNS_TOPIC_ARN': snsTopic.topicArn,
        },
      }
    );

    /***********************************************************
     * End of Lambda Function - 4. Send stats to SNS.
     ***********************************************************/

    /***********************************************************
     * Lambda Function - 5. Notify messages to collaboration tools (e.g. Microsoft Teams, Slack, etc.).
     ***********************************************************/
    const notifyLambdaFunctionPermissionPolicy = new iam.Policy(
      this,
      'domain-protection-notify-lambda-permission-policy',
      {
        policyName: 'domain-protection-notify-lambda-permission-policy',
        document: iam.PolicyDocument.fromJson(
          JSON.parse(fs.readFileSync('resources/iam/policy/domain-protection-notify-lambda-permission-policy.json', 'utf8'))
        )
      }
    );

    const notifyLambdaFunctionRole = new iam.Role(
      this,
      'domain-protection-notify-lambda-role',
      {
        assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
        roleName: 'domain-protection-notify-lambda-role',
        maxSessionDuration: Duration.seconds(3600)
      }
    );
    notifyLambdaFunctionRole.attachInlinePolicy(notifyLambdaFunctionPermissionPolicy);

    // Lambda function - domain protection stats to send to SNS.
    this.notifyLambdaFunction = new lambda.Function(
      this,
      'domain-protection-notify-lambda-function',
      {
        functionName: 'domain-protection-notify-lambda-function',
        description: 'Domain protection Lambda function for notifying to collaboration tools',
        runtime: lambda.Runtime.PYTHON_3_9,
        code: lambda.Code.fromAsset(
          `${lambdaBaseDir}/notify`,
          {
            bundling: {
              image: lambda.Runtime.PYTHON_3_9.bundlingImage,
              command: [
                'bash', '-c',
                'pip install -r requirements.txt -t /asset-output && cp -au . /asset-output'
              ],
            }
          }
        ),
        handler: 'notify.lambda_handler',
        layers: [lambdaLayer],
        role: notifyLambdaFunctionRole,
        timeout: Duration.seconds(900),
        environment: {
          'PROJECT': props.project,
          'TEAMS_CHANNEL': props.teams_channel,
          'TEAMS_WEBHOOK_URL': props.teams_webhook_url,
          'TEAMS_EMOJI': props.teams_emoji,
          'TEAMS_FIX_EMOJI': props.teams_fix_emoji,
          'TEAMS_NEW_EMOJI': props.teams_new_emoji
        },
      }
    );
    snsTopic.addSubscription(new subscriptions.LambdaSubscription(this.notifyLambdaFunction));

    /***********************************************************
     * End of Lambda Function - 5. Notify messages to collaboration tools (e.g. Microsoft Teams, Slack, etc.).
     ***********************************************************/

    /***********************************************************
     * Lambda Function - 6. Resources
     ***********************************************************/
    const resourcesLambdaFunctionPermissionPolicy = new iam.Policy(
      this,
      'domain-protection-resources-lambda-permission-policy',
      {
        policyName: 'domain-protection-resources-lambda-permission-policy',
        document: iam.PolicyDocument.fromJson(
          JSON.parse(fs.readFileSync('resources/iam/policy/domain-protection-resources-lambda-permission-policy.json', 'utf8'))
        )
      }
    );

    const resourcesLambdaFunctionRole = new iam.Role(
      this,
      'domain-protection-resources-lambda-role',
      {
        assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
        roleName: 'domain-protection-resources-lambda-role',
        maxSessionDuration: Duration.seconds(3600)
      }
    );
    resourcesLambdaFunctionRole.attachInlinePolicy(resourcesLambdaFunctionPermissionPolicy);

    // Lambda function - domain protection resources.
    this.resourcesLambdaFunction = new lambda.Function(
      this,
      'domain-protection-resources-lambda-function',
      {
        functionName: 'domain-protection-resources-lambda-function',
        description: 'Domain protection Lambda function for listing resources created to prevent hostile takeover or deleted',
        runtime: lambda.Runtime.PYTHON_3_9,
        code: lambda.Code.fromAsset(
          `${lambdaBaseDir}/resources`,
          {
            bundling: {
              image: lambda.Runtime.PYTHON_3_9.bundlingImage,
              command: [
                'bash', '-c',
                'pip install -r requirements.txt -t /asset-output && cp -au . /asset-output'
              ],
            }
          }
        ),
        handler: 'resources.lambda_handler',
        layers: [lambdaLayer],
        role: resourcesLambdaFunctionRole,
        timeout: Duration.seconds(900),
        environment: {
          'PROJECT': props.project,
          'SNS_TOPIC_ARN': snsTopic.topicArn
        },
      }
    );

    /***********************************************************
     * End of Lambda Function - 6. Resources
     ***********************************************************/

    /***********************************************************
     * Lambda Function - 7. Update
     ***********************************************************/
    const updateLambdaFunctionPermissionPolicy = new iam.Policy(
      this,
      'domain-protection-update-lambda-permission-policy',
      {
        policyName: 'domain-protection-update-lambda-permission-policy',
        document: iam.PolicyDocument.fromJson(
          JSON.parse(fs.readFileSync('resources/iam/policy/domain-protection-update-lambda-permission-policy.json', 'utf8'))
        )
      }
    );

    const updateLambdaFunctionRole = new iam.Role(
      this,
      'domain-protection-update-lambda-role',
      {
        assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
        roleName: 'domain-protection-update-lambda-role',
        maxSessionDuration: Duration.seconds(3600)
      }
    );
    updateLambdaFunctionRole.attachInlinePolicy(updateLambdaFunctionPermissionPolicy);

    // Lambda function - domain protection resources.
    this.updateLambdaFunction = new lambda.Function(
      this,
      'domain-protection-update-lambda-function',
      {
        functionName: 'domain-protection-update-lambda-function',
        description: 'Domain protection Lambda function for updating',
        runtime: lambda.Runtime.PYTHON_3_9,
        code: lambda.Code.fromAsset(
          `${lambdaBaseDir}/update`,
          {
            bundling: {
              image: lambda.Runtime.PYTHON_3_9.bundlingImage,
              command: [
                'bash', '-c',
                'pip install -r requirements.txt -t /asset-output && cp -au . /asset-output'
              ],
            }
          }
        ),
        handler: 'update.lambda_handler',
        layers: [lambdaLayer],
        role: updateLambdaFunctionRole,
        timeout: Duration.seconds(900),
        environment: {
          'ORGANIZATION_PRIMARY_ACCOUNT': props.organization_primary_account,
          'SECURITY_AUDIT_ROLE_NAME': props.security_audit_role_name,
          'PROJECT': props.project,
          'SNS_TOPIC_ARN': snsTopic.topicArn,
          'ALLOWED_REGIONS': "['all']",
          'EXTERNAL_ID': props.external_id,
          'IP_TIME_LIMIT': '48'
        },
      }
    );

    /***********************************************************
     * End of Lambda Function - 7. Update
     ***********************************************************/

    /***********************************************************
     * Lambda Function - 8. Current
     ***********************************************************/
    const currentLambdaFunctionPermissionPolicy = new iam.Policy(
      this,
      'domain-protection-current-lambda-permission-policy',
      {
        policyName: 'domain-protection-current-lambda-permission-policy',
        document: iam.PolicyDocument.fromJson(
          JSON.parse(fs.readFileSync('resources/iam/policy/domain-protection-current-lambda-permission-policy.json', 'utf8'))
        )
      }
    );

    const currentLambdaFunctionRole = new iam.Role(
      this,
      'domain-protection-current-lambda-role',
      {
        assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
        roleName: 'domain-protection-current-lambda-role',
        maxSessionDuration: Duration.seconds(3600)
      }
    );
    currentLambdaFunctionRole.attachInlinePolicy(currentLambdaFunctionPermissionPolicy);

    // Lambda function - domain protection resources.
    this.currentLambdaFunction = new lambda.Function(
      this,
      'domain-protection-current-lambda-function',
      {
        functionName: 'domain-protection-current-lambda-function',
        description: 'Domain protection Lambda function for current',
        runtime: lambda.Runtime.PYTHON_3_9,
        code: lambda.Code.fromAsset(
          `${lambdaBaseDir}/current`,
          {
            bundling: {
              image: lambda.Runtime.PYTHON_3_9.bundlingImage,
              command: [
                'bash', '-c',
                'pip install -r requirements.txt -t /asset-output && cp -au . /asset-output'
              ],
            }
          }
        ),
        handler: 'current.lambda_handler',
        layers: [lambdaLayer],
        role: currentLambdaFunctionRole,
        timeout: Duration.seconds(900),
        environment: {
          'ORGANIZATION_PRIMARY_ACCOUNT': props.organization_primary_account,
          'SECURITY_AUDIT_ROLE_NAME': props.security_audit_role_name,
          'PROJECT': props.project,
          'SNS_TOPIC_ARN': snsTopic.topicArn,
          'ALLOWED_REGIONS': "['all']",
          'EXTERNAL_ID': props.external_id,
          'IP_TIME_LIMIT': '48'
        },
      }
    );

    /***********************************************************
     * End of Lambda Function - 8. Current
     ***********************************************************/
  }
}
