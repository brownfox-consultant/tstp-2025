import { Skeleton, Table } from "antd";
import React from "react";

function UserList({
  dataList,
  cols,
  setCurrent,
  total,
  tableLoading,
  totalPages,
  current,
}) {
  return (
    <Skeleton loading={false}>
      <Table
        rowClassName={(record, index) => {
          return index % 2 === 0 ? "bg-even-color" : "bg-odd-color";
        }}
        footer={() => (
          <div className="flex justify-end mr-5">
            Page {current} of {totalPages} (Total: {total} records)
          </div>
        )}
        columns={cols}
        dataSource={dataList}
        loading={tableLoading}
        pagination={{
          showSizeChanger: false,
          onShowSizeChange: false,
          pageSize: 15,
          onChange: (page) => setCurrent(page),
          total: total,
        }}
        scroll={{ x: "max-content", y: "max-content" }} // Enable horizontal scrolling
      />
    </Skeleton>
  );
}

export default UserList;
