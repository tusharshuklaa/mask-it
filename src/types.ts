export type Message = {
  action: string;
  [key: string]: any;
};

export type StatusResponse = {
  isMaskingActive: boolean;
};

export type ActionResponse = {
  success: boolean;
};
