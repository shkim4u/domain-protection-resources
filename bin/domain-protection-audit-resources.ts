#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { LambdaStack } from '../lib/lambda-stack';
import {StackProps} from "aws-cdk-lib";
import {DynamoDbStack} from "../lib/dynamodb-stack";
import {StepFunctionsStack} from "../lib/step-functions-stack";
import {EventsStack} from "../lib/events-stack";
import * as lambda from "aws-cdk-lib/aws-lambda";
import {SnsStack} from "../lib/sns-stack";

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
    organization_primary_account: "738148780718",
    security_audit_role_name: 'DomainProtectionAuditRole',
    project: "domain-protection",
    sns_topic_arn: `arn:aws:sns:ap-northeast-2:${account}:domain-protection-sns-topic`,
    teams_channel: 'Domain Protection Notification',
    teams_webhook_url: 'https://sanghyounaws.webhook.office.com/webhookb2/705c49a0-2c34-4ce6-90a9-a63c71d1b94a@786acc11-471a-4b85-9c61-2302bed829a4/IncomingWebhook/5ad7c607e659483eaffcd20112f75546/8f5c0ce8-b3f1-4206-be64-b77860cecb47',
    // teams_emoji: ':warning:',
    // teams_fix_emoji: ":white_check_mark:",
    // teams_new_emoji: ":octagonal_sign:",
    teams_emoji: '&#x26A0;',
    teams_fix_emoji: '&#x2705;',
    teams_new_emoji: '&#x1F6A8;',
    external_id: ""
  }
}

new DynamoDbStack(
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

const stepfunctionsStack = new StepFunctionsStack(
  app,
  'Domain-Protection-Resources-StepFunctions',
  {
    ... setenv()
  },
  lambdaStack.scanLambdaFunction
);
stepfunctionsStack.addDependency(lambdaStack, 'StateMachine needs to call to scan Lambda function.');

const eventsStack = new EventsStack(
  app,
  'Domain-Protection-Resources-Events',
  {
    ... setenv()
  },
  lambdaStack.accountsLambdaFunction,
  lambdaStack.currentLambdaFunction,
  lambdaStack.resourcesLambdaFunction,
  lambdaStack.statsLambdaFunction,
  lambdaStack.updateLambdaFunction
);
eventsStack.addDependency(lambdaStack, 'EventBridge rules to trigger Lambda functions.');

// snsStack.addDependency(lambdaStack, 'Lambda subscription to SNS topics.');
