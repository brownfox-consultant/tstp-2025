import React from "react";
import AllUsersTable from "./all-users-table";
import RegisteredTable from "./regsitered-table";
import UpcomingTable from "./upcoming-table";

function UsersTab({ tabKey, api }) {
  return (
    <>
      {" "}
      {tabKey == "all" && <AllUsersTable tabKey={tabKey} api={api} />}
      {tabKey == "registered" && <RegisteredTable tabKey={tabKey} api={api} />}
      {tabKey == "upcoming" && <UpcomingTable tabKey={tabKey} api={api} />}
    
    </>
  );
}

export default UsersTab;
