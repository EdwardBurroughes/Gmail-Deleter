import { gmail_v1 } from "googleapis";

const BATCH_DELETE_MAX = 1000;

async function deleteEmails(gmail: gmail_v1.Gmail, ids: string[]) {
  try {
    const res = await gmail.users.messages.batchDelete({
      userId: "me",
      requestBody: { ids: ids },
    });
    return res.data;
  } catch (e) {
    console.error("failed to delete emails");
    throw e;
  }
}

export async function bulkDeleteEmails(gmail: gmail_v1.Gmail, ids: string[]) {
  console.log(`deleting ${ids.length} emails`);
  for (let index = 0; index < ids.length; index += BATCH_DELETE_MAX) {
    const batchIds = ids.slice(index, index + BATCH_DELETE_MAX);
    console.log(`deleting batch ${index}-${batchIds.length + index}`);
    await deleteEmails(gmail, batchIds);
  }
}
