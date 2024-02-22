import Assistant from "@quasarbrains/assistant";

export class EmailService extends Assistant.Service {
  constructor() {
    super({
      name: "email-service",
      description: "Performs email operations",
      schema: {
        methods: [
          {
            name: "sendEmail",
            description: "Send an email to a recipient",
            parameters: {
              type: "object",
              properties: {
                recipient: {
                  type: "string",
                  description: "the recipient of the email",
                },
                subject: {
                  type: "string",
                  description: "The subject of the email",
                },
                content: {
                  type: "string",
                  description: "the content of the email",
                },
              },
            },
          },
        ],
      },
    });
  }

  public async sendEmail(params: { recipient: string; subject: string; content: string }) {
    console.log("Sending awesome email: ", params);
    return true;
  }
}
