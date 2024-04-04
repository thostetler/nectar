/**
 * Provides access to the user session and methods to logout
 */
export const useSession = () => {
  // const { user, reset } = useUser();
  // const { reload } = useRouter();
  //
  // const { mutate: logout, ...result } = useMutation(['logout'], async () => {
  //   const { data } = await axios.post<ILogoutResponse>('/api/auth/logout');
  //   return data;
  // });
  //
  // useEffect(() => {
  //   if (result.data?.success) {
  //     api.reset();
  //     reset().finally(() => {
  //       reload();
  //     });
  //   }
  // }, [result.data?.success]);
  //
  // useEffect(() => {
  //   if (result.isError) {
  //     reload();
  //   }
  // }, [result.isError]);
  //
  // return {
  //   logout,
  //   isAuthenticated: isAuthenticated(user),
  //   ...result,
  // };
};
