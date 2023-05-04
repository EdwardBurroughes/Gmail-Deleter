import { gmail_v1 } from "googleapis";
import { GaxiosResponse } from "googleapis-common";
import { QueryParam } from "./types";

const END = "END";

type AdditionalParam = {
  pageToken: string;
};

async function listMessages(
  gmail: gmail_v1.Gmail,
  pageToken: string | null,
  queryParam: QueryParam
): Promise<GaxiosResponse<gmail_v1.Schema$ListMessagesResponse>> {
  let additionalParams: Partial<AdditionalParam> = {};
  if (pageToken) {
    additionalParams.pageToken = pageToken;
  }
  try {
    return await gmail.users.messages.list({
      userId: "me",
      maxResults: 511,
      ...queryParam,
      ...additionalParams,
    });
  } catch (e) {
    console.error("unable to list messages");
    throw e;
  }
}

export async function getAllIdsByQueryParams(
  gmail: gmail_v1.Gmail,
  queryParam: QueryParam
): Promise<string[]> {
  let pageToken = null;
  const messageIDs = [];
  while (pageToken !== END) {
    const res: GaxiosResponse<gmail_v1.Schema$ListMessagesResponse> =
      await listMessages(gmail, pageToken, queryParam);
    pageToken = res.data.nextPageToken || END;
    if (res.data.messages) {
      for (const message of res.data.messages) {
        if (message.id) {
          messageIDs.push(message.id);
        }
      }
    }
  }
  return messageIDs;
}
