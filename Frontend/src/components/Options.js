import MathContent from "./MathContent";

export default function Options({ options }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 auto-rows-fr gap-x-4 gap-y-2">
      {options?.map(({ description, is_correct, selected_by_user }, index) => {
        let cls = "rounded-md border p-4 text-base font-medium";
        let style = {};

        if (selected_by_user && is_correct) {
          // Selected and correct
          style = {
            backgroundColor: "#fff7e6",
            borderColor: "#ffd591",
            color: "#d46b08",
          };
        } else if (selected_by_user) {
          // Selected but incorrect
          style = {
            backgroundColor: "#fff7e6",
            borderColor: "#ffd591",
            color: "#d46b08",
          };
        } else if (is_correct) {
          // Correct but not selected
          style = {
            backgroundColor: "#fff7e6",
            borderColor: "#ffd591",
            color: "#d46b08",
          };
        } else {
          // Default option
          style = {
            backgroundColor: "#f5f5f5",
            borderColor: "#d9d9d9",
            color: "#595959",
          };
        }

        return (
          <MathContent
            key={index}
            cls={cls}
            style={style}
            content={description}
          />
        );
      })}
    </div>
  );
}
