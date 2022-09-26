import {DomainProtectionStackProps} from './props';
import {RemovalPolicy, Stack} from 'aws-cdk-lib';
import {Construct} from 'constructs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb'
import {TableEncryption} from 'aws-cdk-lib/aws-dynamodb'

export class DynamoDbStack extends Stack {
  constructor(scope: Construct, id: string, props: DomainProtectionStackProps) {
    super(scope, id, props);

    const DynamoDbTable = new dynamodb.Table(
      this,
      'domain-protection-vulnerable-domains-dynamodb-table',
      {
        tableName: 'DomainProtectionVulnerableDomains',
        partitionKey: {name: 'Domain', type: dynamodb.AttributeType.STRING},
        sortKey: {name: 'FoundDateTime', type: dynamodb.AttributeType.STRING},
        readCapacity: 3,
        writeCapacity: 2,
        removalPolicy: RemovalPolicy.SNAPSHOT,
        encryption: TableEncryption.CUSTOMER_MANAGED,
        timeToLiveAttribute: 'false'
      }
    );
  }
}
