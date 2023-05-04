import { google, gmail_v1 } from "googleapis";
import { OAuth2Client } from "google-auth-library";
import { authorize } from "./src/auth";
import { bulkDeleteEmails } from "./src/delete_utils";
import { getAllIdsByQueryParams } from "./src/message_utils";
import { Command, OptionValues } from "commander";
import { QueryParam } from "./src/types";
const inquirer = require("inquirer");

const CLI_VERSION = "1.0.0";

class InputError extends Error {}

class InValidEmailAddress extends InputError {}

class InValidStringInput extends InputError {}

const program = new Command();
program
  .version(CLI_VERSION)
  .description(
    "A CLI tool to delete gmail emails via the sender or label or both"
  )
  .option(
    "-l, --label [labelName]",
    "specify the gmail label name",
    (value: string, previous: string[]) => {
      return previous.concat([validateStringInput(value)]);
    }
  )
  .option(
    "-s, --sender [senderEmail]",
    "specify the sender name",
    (value: string, previous: string[]) => {
      return previous.concat([validateEmailAddress(value)]);
    }
  )
  .parse(process.argv);

function validateEmailAddress(email: string): string {
  const stringValidatedEmail = validateStringInput(email);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(stringValidatedEmail) || !stringValidatedEmail) {
    console.error(
      `identified an invalid email address ${stringValidatedEmail}`
    );
    throw new InValidEmailAddress(stringValidatedEmail);
  }
  return stringValidatedEmail;
}

function validateStringInput(value: string): string {
  if (!value || typeof value !== "string") {
    console.error(`bad input string provided ${value}`);
    throw new InValidStringInput(value);
  }

  return value;
}

function handleOptions(cliOptions: OptionValues): QueryParam {
  const { senderEmail, labelName } = cliOptions;

  if (typeof senderEmail === undefined && typeof labelName === undefined) {
    console.error("Please provide an input for label id or sender email");
    throw new InputError();
  }
  const queryParams: QueryParam = {};
  if (senderEmail) {
    queryParams.q = senderEmail
      .map((sender: string) => `from:${sender}`)
      .join(" OR ");
  }

  if (labelName) {
    queryParams.labelIds = [...labelName];
  }
  return queryParams;
}

async function retrieveChoice(message: string): Promise<any> {
  return await inquirer.prompt([
    {
      type: "confirm",
      message: message,
      name: "deleteChoice",
    },
  ]);
}

async function handleUserInput(
  userInput: any,
  gmail: gmail_v1.Gmail,
  ids: string[]
) {
  if (userInput.deleteChoice) {
    await bulkDeleteEmails(gmail, ids);
    console.log("succesfully deleted the emails");
  } else {
    console.log("not deleting the emails don't worry ;)");
  }
}

async function deleteEmailsByQueryParam(
  auth: OAuth2Client,
  queryParam: QueryParam
) {
  const gmail = google.gmail({ version: "v1", auth });
  const ids = await getAllIdsByQueryParams(gmail, queryParam);
  if (!ids.length) {
    console.log(`no emails found for query params: ${queryParam}`);
    return;
  }
  const input = `Are you sure you want to delete ${ids.length} from gmail ${queryParam}`;
  const userInput = await retrieveChoice(input);
  await handleUserInput(userInput, gmail, ids);
}

async function main() {
  const options = program.opts();
  const cleanOptions = handleOptions(options);
  const auth = await authorize();
  try {
    await deleteEmailsByQueryParam(auth, cleanOptions);
  } catch (e) {
    console.error(
      `failed to delete emails with queryParams ${options} due to ${e}`
    );
    throw e;
  }
}

if (require.main === module) {
  main();
}
