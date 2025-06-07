import {
  BucketAlreadyOwnedByYou,
  CreateBucketCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';

import { Result, ResultType } from '../../lib/Result';
import { notEmpty, wrapUnknownError } from '../../utils';
import { awsConfig } from './config';

const s3Client = new S3Client(awsConfig);

/**
 * Creates an S3 bucket.
 */
export async function createBucket(bucketName: string): Promise<void> {
  try {
    console.info(`Creating S3 bucket: ${bucketName}`);
    const command = new CreateBucketCommand({ Bucket: bucketName });
    await s3Client.send(command);
  } catch (err) {
    if (err instanceof BucketAlreadyOwnedByYou) {
      // expected case
      return;
    }
    console.error(err);
    throw err;
  }
}

/**
 * Retrieves the specified object key from S3.
 */
export async function getFromS3(
  bucketName: string,
  objectKey: string,
): Promise<ResultType<string, Error>> {
  try {
    console.info(`Getting object from S3: ${bucketName}/${objectKey}`);
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: objectKey,
    });
    const output = await s3Client.send(command);

    if (!output.Body) {
      throw new Error('Missing response body from S3');
    }

    const contents = await output.Body.transformToString();
    return Result.Ok(contents);
  } catch (err) {
    return Result.Err(wrapUnknownError(err));
  }
}

/**
 * Saves object(s) to S3, where each key-value in the data dict represents a single object.
 */
export async function saveToS3(
  bucketName: string,
  data: Record<string, unknown>,
) {
  await createBucket(bucketName);

  try {
    console.info(
      `Saving ${
        Object.keys(data).length
      } objects to S3 bucket ${bucketName}: ${Object.keys(data).join(', ')}`,
    );
    await Promise.all(
      Object.entries(data).map(([key, datum]) => {
        const command = new PutObjectCommand({
          Bucket: bucketName,
          Key: key,
          Body: JSON.stringify(datum, null, 4),
        });
        s3Client.send(command);
      }),
    );
  } catch (err) {
    console.error('[s3 > saveToS3]', err);
  }
}

export async function listObjects(bucketName: string) {
  try {
    console.info(`Listing objects in S3 bucket: ${bucketName}`);
    const command = new ListObjectsV2Command({ Bucket: bucketName });
    const listObjectsOutput = await s3Client.send(command);

    if (!listObjectsOutput.Contents) {
      throw new Error('Missing response contents from S3');
    }
    return Result.Ok(listObjectsOutput.Contents);
  } catch (err) {
    console.error('[s3 > listObjects]', err);
    return Result.Err(wrapUnknownError(err));
  }
}

/**
 * Deletes all objects in the S3 bucket except for those corresponding to the specified object keys.
 */
export async function deleteAllObjectsExcept(
  bucketName: string,
  objectKeysToKeep: string[],
) {
  const listObjectsCommand = new ListObjectsV2Command({ Bucket: bucketName });
  const listObjectsOutput = await s3Client.send(listObjectsCommand);

  const objectKeysToDelete = listObjectsOutput.Contents?.map(
    (listObjectOutput) => listObjectOutput.Key,
  )
    .filter(notEmpty)
    .filter((objectKey) => !objectKeysToKeep.includes(objectKey));
  if (!objectKeysToDelete || objectKeysToDelete.length === 0) return;

  console.info(
    `Deleting ${objectKeysToDelete.length} objects from S3 bucket: ${bucketName}`,
  );
  try {
    const deleteObjectsCommand = new DeleteObjectsCommand({
      Bucket: bucketName,
      Delete: {
        Objects: objectKeysToDelete.map((objectKey) => ({ Key: objectKey })),
      },
    });
    s3Client.send(deleteObjectsCommand);
  } catch (err) {
    console.error('[s3 > deleteAllObjectsExcept]', err);
  }
}
