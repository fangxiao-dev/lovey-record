import { CLOUD_CONFIG, DEV_API_BASE_URL } from '../config/api.js';

/**
 * Unified request handler that routes to wx.cloud.callContainer in production,
 * and uni.request in development.
 *
 * @param {string} path - API path (e.g., '/queries/getModuleAccessState')
 * @param {string} method - HTTP method ('GET', 'POST')
 * @param {object} data - Request payload/query params
 * @param {object} headers - HTTP headers (including 'x-wx-openid', 'content-type')
 * @returns {Promise<{statusCode: number, data: {ok: boolean, data: any, error?: any}}>}
 */
export async function cloudRequest({ path, method = 'GET', data, headers }) {
  const useCloudApi = (() => {
    try {
      const info = wx.getAccountInfoSync();
      const envVersion = info && info.miniProgram && info.miniProgram.envVersion;
      console.log('[cloudRequest] envVersion:', envVersion);
      return envVersion === 'release' || envVersion === 'trial';
    } catch (e) {
      console.log('[cloudRequest] getAccountInfoSync failed:', e && e.message);
      return false; // H5 / local dev — no wx object
    }
  })();
  console.log('[cloudRequest]', useCloudApi ? 'wx→callContainer' : 'h5→uni.request', path,
    useCloudApi ? { envId: CLOUD_CONFIG.envId, svc: CLOUD_CONFIG.serviceName } : '');

  if (useCloudApi) {
    // Production: use wx.cloud.callContainer (WeChat official secure method)
    return callCloudContainer({ path, method, data, headers });
  } else {
    // Development: use uni.request to local server
    return callUniRequest({ path, method, data, headers });
  }
}

/**
 * Call wx.cloud.callContainer (production mode)
 * WeChat gateway automatically injects X-WX-OPENID header
 */
async function callCloudContainer({ path, method, data, headers }) {
  return new Promise((resolve, reject) => {
    try {
      wx.cloud.callContainer({
        config: {
          env: CLOUD_CONFIG.envId,
        },
        path,
        method,
        header: {
          ...headers,
          'X-WX-SERVICE': CLOUD_CONFIG.serviceName, // Service name header
          'content-type': 'application/json',
        },
        data,
        success: (response) => {
          // Convert wx.cloud.callContainer response format to match uni.request
          const result = {
            statusCode: 200,
            data: response.data || response, // Handle both response formats
          };
          resolve(result);
        },
        fail: (error) => {
          reject(new Error(error?.message || 'Cloud request failed'));
        },
      });
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Call uni.request (development mode)
 * Used for local testing against dev server
 */
async function callUniRequest({ path, method, data, headers }) {
  const url = DEV_API_BASE_URL + path;

  return new Promise((resolve, reject) => {
    uni.request({
      url,
      method,
      data,
      header: headers,
      success: (response) => resolve(response),
      fail: (error) => reject(new Error(error?.errMsg || error?.message || 'uni.request failed')),
    });
  });
}
