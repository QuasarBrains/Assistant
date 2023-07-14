import React, { createContext, useMemo } from "react";
import { User } from "../declarations/main";
import useFetch from "../Hooks/useFetch";
import { useNavigate } from "react-router-dom";

export interface UserContextValue {
  user: User;
  isLoggedIn: boolean;
  loadUser: () => void;
}

export const UserContext = createContext<UserContextValue>({
  user: {
    id: undefined,
    email: "",
    role: "user",
    firstName: "",
    lastName: "",
    createdAt: "",
    updatedAt: "",
  },
  isLoggedIn: false,
  loadUser: () => {},
});

export const UserProvider = ({
  children,
}: {
  children: JSX.Element | JSX.Element[];
}) => {
  const navigate = useNavigate();

  const { data: user, load: loadUser } = useFetch<undefined, User>({
    url: "/users/me",
    onError: () => {
      navigate("/login");
    },
    runOnMount: localStorage.getItem("accessToken") ? true : false,
  });

  const value: UserContextValue = useMemo(
    () => ({
      user: user || {
        id: undefined,
        email: "",
        role: "user",
        firstName: "",
        lastName: "",
        createdAt: "",
        updatedAt: "",
      },
      isLoggedIn: !!user?.id,
      loadUser,
    }),
    [user]
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export const useUser = () => React.useContext(UserContext);
