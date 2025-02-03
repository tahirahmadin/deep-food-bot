import axios, { AxiosResponse } from "axios";
import CryptoJS from "crypto-js";

let apiUrl: string = "https://payments.gobbl.ai/api";

// Define types for the encryption function
interface CipherTextResponse {
  data: string;
}

// Encryption function
export const getCipherText = (inputBodyData: object): CipherTextResponse => {
  let secretKey: string = import.meta.env.VITE_CIPHER_KEY;

  const key = CryptoJS.enc.Utf8.parse(secretKey);

  const encrypted = CryptoJS.AES.encrypt(JSON.stringify(inputBodyData), key, {
    mode: CryptoJS.mode.ECB,
  });

  const encryptedText: string = encrypted.toString();

  return { data: encryptedText };
};

// Define types for HMAC response
interface HmacResponse {
  hmacHash: string;
  currentTimestamp: string;
}

// Get HMAC message
const getHmacMessageFromBody = (inputBodyData: string): HmacResponse | null => {
  const apiSecret: string | undefined = import.meta.env.VITE_HMAC_KEY;

  if (apiSecret) {
    const currentTimestamp: string = (Date.now() / 1000).toString();

    const hmacHash: string = CryptoJS.HmacSHA256(
      inputBodyData + currentTimestamp,
      apiSecret
    ).toString();

    return {
      hmacHash: hmacHash,
      currentTimestamp: currentTimestamp,
    };
  } else {
    return null;
  }
};

// *************** HMAC BASED APIS **************************

// Define types for the API response
interface ApiResponse<T> {
  result?: T;
  error?: boolean;
}

//1. USER:: GET User Leader Data by address
export const getUserLeaderboardData = async (
  userId: string
): Promise<any | null> => {
  try {
    let requestParams: string = `userId=${userId}`;
    let url: string = `${apiUrl}/user/getUserData?${requestParams}`;

    // HMAC Response
    let hmacResponse: HmacResponse | null =
      getHmacMessageFromBody(requestParams);

    if (!hmacResponse) {
      return null;
    }

    let axiosHeaders: { HMAC: string; Timestamp: string } = {
      HMAC: hmacResponse.hmacHash,
      Timestamp: hmacResponse.currentTimestamp,
    };

    let response: AxiosResponse = await axios.get(url, {
      headers: axiosHeaders,
    });

    if (response.data && response.data.result) {
      return response.data.result;
    } else {
      return null;
    }
  } catch (err) {
    return null;
  }
};

//2. USER:: SignUp and Login POST Login user using telegram
export const loginUserFromBackendServer = async (
  via: string,
  handle: string
): Promise<{ error: boolean; result: any }> => {
  let url: string = `${apiUrl}/user/signUpUser`;
  let data: {
    handle: string;
    via: string;
  } = {
    handle: handle,
    via: via,
  };

  // Encrypted data
  let encryptedData: CipherTextResponse = getCipherText(data);

  let response: AxiosResponse = await axios
    .post(url, encryptedData)
    .then((res: AxiosResponse) => res)
    .catch((err: any) => err.response);

  if (response.data && !response.data.error) {
    return { error: false, result: response.data.result };
  } else {
    return { error: true, result: response.data.result };
  }
};

//3. USER:: Get User Orders
export const getUserOrders = async (
  userId: string
): Promise<ApiResponse<any>> => {
  try {
    let requestParams: string = `userId=${userId}`;
    let url: string = `${apiUrl}/user/getUserOrderHistory?${requestParams}`;

    const response: AxiosResponse = await axios.get(url);

    if (response.data && !response.data.error) {
      console.log("Orders response:", response.data.result);
      return { error: false, result: response.data.result };
    } else {
      console.error("Orders API error:", response.data);
      return { error: true, result: response.data.result };
    }
  } catch (err) {
    console.error("Orders API exception:", err);
    return { error: true };
  }
};
