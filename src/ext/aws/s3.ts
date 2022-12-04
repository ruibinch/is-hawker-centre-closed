import * as AWS from 'aws-sdk';

import { Result, ResultType } from '../../lib/Result';
import { notEmpty, wrapUnknownError } from '../../utils';
import { initAWSConfig } from './config';

initAWSConfig();
const s3 = new AWS.S3();

/**
 * Creates an S3 bucket.
 *
 * Assume that a thrown error here indicates that the bucket already exists, in which case we can ignore it.
 */
async function createBucket(bucketName: string): Promise<void> {
  try {
    await s3.createBucket({ Bucket: bucketName }).promise();
    // eslint-disable-next-line no-empty
  } catch (err) {}
}

/**
 * Retrieves the specified object key from S3.
 */
export async function getFromS3(
  bucketName: string,
  objectKey: string,
): Promise<ResultType<string, Error>> {
  try {
    const getObjectOutput = await s3
      .getObject({
        Bucket: bucketName,
        Key: objectKey,
      })
      .promise();

    if (getObjectOutput.Body) {
      return Result.Ok(getObjectOutput.Body.toString());
    }

    return Result.Err(
      getObjectOutput.$response.error
        ? getObjectOutput.$response.error
        : wrapUnknownError(`Error reading from S3 bucket "${bucketName}"`),
    );
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
    await Promise.all(
      Object.entries(data).map(([key, datum]) =>
        s3
          .putObject({
            Bucket: bucketName,
            Key: key,
            Body: JSON.stringify(datum, null, 4),
          })
          .promise(),
      ),
    );
  } catch (err) {
    console.log('[s3 > saveToS3]', err);
  }
}

export async function listObjects(bucketName: string) {
  try {
    const listObjectsOutput = await s3
      .listObjectsV2({ Bucket: bucketName })
      .promise();

    if (listObjectsOutput.Contents) {
      return Result.Ok(listObjectsOutput.Contents);
    }

    return Result.Err(
      listObjectsOutput.$response.error
        ? listObjectsOutput.$response.error
        : wrapUnknownError(
            `Error listing objects in S3 bucket "${bucketName}"`,
          ),
    );
  } catch (err) {
    console.log('[s3 > listObjects]', err);
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
  const listObjectsOutput = await s3
    .listObjectsV2({ Bucket: bucketName })
    .promise();
  const objectKeysToDelete = listObjectsOutput.Contents?.map(
    (listObjectOutput) => listObjectOutput.Key,
  )
    .filter(notEmpty)
    .filter((objectKey) => !objectKeysToKeep.includes(objectKey));
  if (!objectKeysToDelete) return;

  try {
    await s3
      .deleteObjects({
        Bucket: bucketName,
        Delete: {
          Objects: objectKeysToDelete.map((objectKey) => ({ Key: objectKey })),
        },
      })
      .promise();
  } catch (err) {
    console.log('[s3 > deleteAllObjectsExcept]', err);
  }
}
