import {StackProps} from "aws-cdk-lib";

export interface DomainProtectionStackProps extends StackProps {
  organization_primary_account: string,
  security_audit_role_name: string,
  project: string,
  sns_topic_arn: string,
  teams_channel: string,
  teams_webhook_url: string,
  teams_emoji: string,
  teams_fix_emoji: string,
  teams_new_emoji: string,
  external_id: string
}
