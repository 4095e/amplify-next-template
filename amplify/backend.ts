import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { contentModerator } from './functions/content-moderator/resource';
import { Effect, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { Topic } from 'aws-cdk-lib/aws-sns';
import { EmailSubscription } from 'aws-cdk-lib/aws-sns-subscriptions';

const backend = defineBackend({
  auth,
  data,
  contentModerator,
});

// Create SNS Topic
const snsTopic = new Topic(backend.contentModerator.resources.lambda, 'ContentModerationTopic', {
  topicName: 'content-moderation-alerts',
  displayName: 'Content Moderation Alerts'
});

// Add email subscription
snsTopic.addSubscription(new EmailSubscription('officialdevkota@gmail.com'));

// Grant Lambda permission to publish to SNS
backend.contentModerator.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    effect: Effect.ALLOW,
    actions: ['sns:Publish'],
    resources: [snsTopic.topicArn],
  })
);

// Add environment variable for SNS topic ARN
backend.contentModerator.addEnvironment('SNS_TOPIC_ARN', snsTopic.topicArn);

// Grant Lambda permission to read from DynamoDB (for manual invocation)
const table = backend.data.resources.tables['Todo'];
backend.contentModerator.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    effect: Effect.ALLOW,
    actions: [
      'dynamodb:GetItem',
      'dynamodb:Query',
      'dynamodb:Scan'
    ],
    resources: [table.tableArn],
  })
);
