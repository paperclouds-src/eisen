import { useEffect, useRef, useState, Fragment } from "react";
import "./styles/App.css";
import Cell from "./components/Cell";
import Input from "./components/Input";
import Undo from "./components/Undo";
import { DragDropContext } from "react-beautiful-dnd";

const retrieveData = () => {
  if (localStorage.getItem("matrixbeta")) {
    return JSON.parse(localStorage.getItem("matrixbeta"));
  } else {
    return { "cell-1": [], "cell-2": [], "cell-3": [], "cell-4": [] };
  }
};

const retrieveCells = () => {
  if (localStorage.getItem("matrixbeta-cells")) {
    return JSON.parse(localStorage.getItem("matrixbeta-cells"));
  } else {
    return [
      { type: "cell-1", title: "Do it" },
      { type: "cell-2", title: "Schedule it" },
      { type: "cell-3", title: "Delegate it" },
      { type: "cell-4", title: "Delete it" },
    ];
  }
};

const dateToYMD = (date) => {
  var strArray = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  var d = date.getDate();
  var m = strArray[date.getMonth()];
  var y = date.getFullYear();
  return "" + (d <= 9 ? "0" + d : d) + "-" + m + "-" + y;
};

function App() {
  const [cells, setCells] = useState(retrieveCells());
  const [tasks, setTasks] = useState(retrieveData());
  const [taskTarget, setTaskTarget] = useState("");
  const [movedStatus, updateMovedStatus] = useState(false);
  const [deletedTask, setDeletedTask] = useState({});
  const [deletedTaskType, setDeletedTaskType] = useState("");
  const undoTimerRef = useRef(null);
  const inputRef = useRef();

  const exportTasks = () => {
    const filename = `eisen-${dateToYMD(new Date())}.json`;
    const blob = new Blob([localStorage.getItem("matrixbeta")], {
      type: "text/json",
    });

    console.log(blob);
    const link = document.createElement("a");

    link.download = filename;
    link.href = window.URL.createObjectURL(blob);
    link.dataset.downloadurl = ["text/json", link.download, link.href].join(
      ":"
    );

    const event = new MouseEvent("click", {
      view: window,
      bubbles: true,
      cancelable: true,
    });

    link.dispatchEvent(event);
    link.remove();
  };

  useEffect(() => {
    if (taskTarget !== "") {
      inputRef.current.focus();
    }
  }, [taskTarget]);

  useEffect(() => {
    localStorage.setItem("matrixbeta", JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem("matrixbeta-cells", JSON.stringify(cells));
  }, [cells]);

  useEffect(() => {
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        e.target.value = "";
        setTaskTarget("");
      }
      if (e.altKey) {
        switch (e.code) {
          case "Digit1":
            setTaskTarget("cell-1");
            break;
          case "Digit2":
            setTaskTarget("cell-2");
            break;
          case "Digit3":
            setTaskTarget("cell-3");
            break;
          case "Digit4":
            setTaskTarget("cell-4");
            break;
          default:
            return;
        }
      }
    });
  }, []);

  useEffect(() => {
    const updatedTasks = JSON.parse(JSON.stringify(tasks));
    for (let cell in tasks) {
      let notdone = [];
      let done = [];

      tasks[cell].forEach((task) => {
        if (task.done === false) {
          notdone.push(task);
        } else {
          done.push(task);
        }
      });

      updatedTasks[cell] = [...notdone, ...done];
    }
    setTasks(updatedTasks);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [movedStatus]);

  const reorder = (droppableId, startIndex, endindex) => {
    const updatedTasks = JSON.parse(JSON.stringify(tasks));

    const [reorderedTask] = updatedTasks[droppableId].splice(startIndex, 1);

    updatedTasks[droppableId].splice(endindex, 0, reorderedTask);

    setTasks(updatedTasks);
  };

  const move = (source, destination) => {
    const updatedTasks = JSON.parse(JSON.stringify(tasks));

    const [removedTask] = updatedTasks[source.droppableId].splice(
      source.index,
      1
    );

    updatedTasks[destination.droppableId].splice(
      destination.index,
      0,
      removedTask
    );

    setTasks(updatedTasks);
  };

  const handleOnDragEnd = (result) => {
    const { source, destination } = result;
    if (!destination) return;

    if (source.droppableId === destination.droppableId) {
      reorder(source.droppableId, source.index, destination.index);
    } else {
      move(source, destination);
    }

    updateMovedStatus(!movedStatus);
  };

  useEffect(() => {
    if (deletedTaskType !== "") {
      undoTimerRef.current = setTimeout(function () {
        setDeletedTaskType("");
      }, 6000);
    } else {
      clearTimeout(undoTimerRef.current);
    }
  }, [deletedTaskType]);

  return (
    <Fragment>
      <div id="matrix">
        <DragDropContext onDragEnd={handleOnDragEnd}>
          {cells.map((cell, index) => (
            <Cell
              cell={cell}
              cells={cells}
              setCells={setCells}
              tasks={tasks}
              setTasks={setTasks}
              setTaskTarget={setTaskTarget}
              key={cell.type}
              setDeletedTask={setDeletedTask}
              setDeletedTaskType={setDeletedTaskType}
            ></Cell>
          ))}
        </DragDropContext>
      </div>
      {taskTarget !== "" ? (
        <Input
          cells={cells}
          tasks={tasks}
          setTasks={setTasks}
          inputRef={inputRef}
          taskTarget={taskTarget}
          setTaskTarget={setTaskTarget}
        ></Input>
      ) : (
        <></>
      )}

      {deletedTaskType !== "" ? (
        <Undo
          tasks={tasks}
          deletedTask={deletedTask}
          setTasks={setTasks}
          deletedTaskType={deletedTaskType}
          setDeletedTaskType={setDeletedTaskType}
        ></Undo>
      ) : (
        <></>
      )}
    </Fragment>
  );
}

export default App;
