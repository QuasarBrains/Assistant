import Assistant from "@onyx-assistant/core";
import Axios from "axios";

class AxiosService extends Assistant.Service {
  private axios = Axios.create();

  constructor() {
    super({
      name: "axios-service",
      description: "Use the Axios library to make HTTP request.",
      schema: {
        methods: [
          {
            name: "get",
            description: "make a get request.",
            parameters: {
              type: "object",
              properties: {
                url: {
                  type: "string",
                  description: "the url to make the request to.",
                },
                params: {
                  type: "object",
                  description: "the query parameters to send with the request.",
                },
              },
              required: ["url"],
            },
            performAction: (params: { url: string; params?: any }) =>
              this.get(params),
          },
          {
            name: "post",
            description: "make a post request.",
            parameters: {
              type: "object",
              properties: {
                url: {
                  type: "string",
                  description: "the url to make the request to.",
                },
                data: {
                  type: "object",
                  description: "the data to send with the request.",
                },
                params: {
                  type: "object",
                  description: "the query parameters to send with the request.",
                },
              },
              required: ["url", "data"],
            },
            performAction: (params: { url: string; data: any; params?: any }) =>
              this.post(params),
          },
        ],
      },
    });
  }

  public async get({ url, params }: { url: string; params?: any }) {
    const response = await this.axios.get(url, { params });
    return response.data;
  }

  public async post({
    url,
    data,
    params,
  }: {
    url: string;
    data: any;
    params?: any;
  }) {
    const response = await this.axios.post(url, data, { params });
    return response.data;
  }
}

export default [new AxiosService()];
