import * as cdk from 'aws-cdk-lib'
import {DynamoDbStack} from "../lib/dynamodb-stack";
import {SnsStack} from "../lib/sns-stack";
import {LambdaStack} from "../lib/lambda-stack";
import {Template} from "aws-cdk-lib/assertions";
import {debug} from "aws-cdk/lib/logging";

const app = new cdk.App();

const region = app.node.tryGetContext('region') || process.env.CDK_INTEG_REGION || process.env.CDK_DEFAULT_REGION;
const account= app.node.tryGetContext('account') || process.env.CDK_INTEG_ACCOUNT || process.env.CDK_DEFAULT_ACCOUNT;

function setenv() {
  return {
    env: {
      region: region,
      account: account,
    },
    // TODO: Organization 어카운트. 대개 Control Tower의 Management 어카운트
    organization_primary_account: "878115720902",
    security_audit_role_name: 'DomainProtectionAuditRole',
    project: "domain-protection",
    sns_topic_arn: `arn:aws:sns:ap-northeast-2:${account}:domain-protection-sns-topic`,
    teams_channel: 'SCK Siren Platform PJT',
    teams_webhook_url: 'https://sanghyounaws.webhook.office.com/webhookb2/705c49a0-2c34-4ce6-90a9-a63c71d1b94a@786acc11-471a-4b85-9c61-2302bed829a4/IncomingWebhook/bfe925450fef4c78917ca5d0691d5004/8f5c0ce8-b3f1-4206-be64-b77860cecb47',
    // teams_emoji: ':warning:',
    // teams_fix_emoji: ":white_check_mark:",
    // teams_new_emoji: ":octagonal_sign:",
    teams_emoji: '&#x26A0;',
    teams_fix_emoji: '&#x2705;',
    teams_new_emoji: '&#x1F6A8;',
    external_id: ""
  }
}

describe("LambdaStack", () => {
  test("synthesizes the way we expect", () => {
    const dynamoDbStack = new DynamoDbStack(
      app,
      'Domain-Protection-Resources-DynamoDB',
      {
        ... setenv()
      }
    );

    const snsStack = new SnsStack(
      app,
      'Domain-Protection-Resources-SNS',
      {
        ... setenv()
      },
    );

    const lambdaStack = new LambdaStack(
      app,
      'Domain-Protection-Resources-Lambda',
      {
        ... setenv()
      },
      snsStack.snsTopic
    );
    lambdaStack.addDependency(snsStack);

    // // Now assert we have 2 Lambda subscriptions in SNS topic.
    // const snsStackTemplate = Template.fromStack(snsStack);
    // snsStackTemplate.resourceCountIs("AWS::SNS::Subscription", 2);

  })
});
