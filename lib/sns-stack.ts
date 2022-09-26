import {DomainProtectionStackProps} from "./props";
import {Stack} from 'aws-cdk-lib';
import {Construct} from 'constructs';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import * as iam from 'aws-cdk-lib/aws-iam';
import {AnyPrincipal, Effect} from "aws-cdk-lib/aws-iam";
import * as lambda from 'aws-cdk-lib/aws-lambda';

export class SnsStack extends Stack {
  public readonly snsTopic: sns.Topic;
  public readonly snsTopicDlq: sns.Topic;

  constructor(
    scope: Construct,
    id: string,
    props: DomainProtectionStackProps,
    // takeoverLambdaFunction: lambda.Function,
    // notifyLambdaFunction: lambda.Function
  ) {
    super(scope, id, props);

    const snsTopicPolicyStatement = new iam.PolicyStatement(
      {
        sid: 'allow_account_access_to_domain_protection_topic',
        principals: [new AnyPrincipal()],
        effect: Effect.ALLOW,
        actions: [
          'sns:GetTopicAttributes',
          'sns:SetTopicAttributes',
          'sns:AddPermission',
          'sns:RemovePermission',
          'sns:DeleteTopic',
          'sns:Subscribe',
          'sns:ListSubscriptionsByTopic',
          'sns:Publish',
          'sns:Receive'
        ],
        conditions: {
          'StringEquals': {
            'AWS:SourceOwner': props.env?.account
          }
        }
      }
    );

    // SNS topic.
    this.snsTopic = new sns.Topic(
      this,
      'domain-protection-sns-topic',
      {
        topicName: 'domain-protection-sns-topic',
        displayName: 'Domain Protection SNS Topic',
      }
    );
    // snsTopic.addSubscription(new subscriptions.LambdaSubscription(takeoverLambdaFunction));
    // snsTopic.addSubscription(new subscriptions.LambdaSubscription(notifyLambdaFunction));
    snsTopicPolicyStatement.addResources(
      this.snsTopic.topicArn,
    );
    this.snsTopic.addToResourcePolicy(snsTopicPolicyStatement);

    const snsTopicDlqPolicyStatement = new iam.PolicyStatement(
      {
        sid: 'allow_account_access_to_domain_protection_topic',
        principals: [new AnyPrincipal()],
        effect: Effect.ALLOW,
        actions: [
          'sns:GetTopicAttributes',
          'sns:SetTopicAttributes',
          'sns:AddPermission',
          'sns:RemovePermission',
          'sns:DeleteTopic',
          'sns:Subscribe',
          'sns:ListSubscriptionsByTopic',
          'sns:Publish',
          'sns:Receive'
        ],
        conditions: {
          'StringEquals': {
            'AWS:SourceOwner': props.env?.account
          }
        }
      }
    );

    // SNS DLQ topic.
    this.snsTopicDlq = new sns.Topic(
      this,
      'domain-protection-sns-topic-dlq',
      {
        topicName: 'domain-protection-sns-topic-dlq',
        displayName: 'Domain Protection SNS Topic DLQ'
      }
    );
    snsTopicDlqPolicyStatement.addResources(
      this.snsTopicDlq.topicArn,
    );
    this.snsTopicDlq.addToResourcePolicy(snsTopicDlqPolicyStatement);
  }
}
