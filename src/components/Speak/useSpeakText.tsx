import { QueryFunction, useQuery, UseQueryOptions } from "react-query";
import axios from 'axios';

const fetchText: QueryFunction = async ({ queryKey }) => {
  const { data } = await axios.request<{ url: string }>({
    url: '/api/speech',
    method: 'POST',
    data: queryKey[1],
    type
  });
  return data;
}
export const useSpeakText = ({ text, queryOptions }: { text: string; queryOptions?: UseQueryOptions }) => {
  return useQuery({
    queryKey: ['tts', text],
    queryFn: async () => ,
    enabled: text?.length > 0,
    ...queryOptions,
  });
};
