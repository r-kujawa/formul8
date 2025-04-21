import axios from 'axios';
import { reactive } from 'vue';
import { cloneDeep } from 'es-toolkit';

export default function useForm(data) {
  const initialData = data;

  const form = reactive({
    ...cloneDeep(initialData),
    errors: {},
    processing: false,
    recentlySuccessful: false,
    data: () => Object.keys(initialData)
      .reduce((data, key) => {
        data[key] = form[key];
        return data;
      }, {}),
    submit: (...args) => {
      const isObject = typeof args[0] === 'object';
      const method = isObject ? args[0].method : args[0];
      const url = isObject ? args[0].url : args[1];
      const options = (isObject ? omit(args[0], ['method', 'url']) : args[2]) ?? {};

      form.processing = true;
      form.errors = {};
      form.recentlySuccessful = false;

      // ToDo: Add transform callback feature.
      const data = form.data();

      const http = axios.create({
        baseURL: import.meta.env.VITE_APP_URL || '',
        ...options,
      });

      http.interceptors.request.use((config) => {
        form.processing = true;
        form.recentlySuccessful = false;
        form.errors = {};

        return config;
      });

      http.interceptors.response.use((response) => {
        form.processing = false;
        form.recentlySuccessful = true;

        setTimeout(() => {
          form.recentlySuccessful = false;
        }, 3000);

        return response;
      }, (error) => {
        form.processing = false;

        if (error.response?.status === 422) {
          form.errors = error.response.data.errors || {};
        }

        return Promise.reject(error);
      })

      return http[method](url, data);
    },
  })

  return form;
}
