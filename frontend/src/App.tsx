import { useState } from "react";
import "./App.css";

function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 text-foreground">
      <h1 className="text-3xl font-bold mb-4">ReachInbox Scheduler</h1>
      <p className="text-muted-foreground mb-6">
        TanStack Router & Query configured successfully.
      </p>
      <button
        type="button"
        className="px-4 py-2 bg-primary text-primary-foreground rounded-md shadow hover:bg-primary/90 transition-colors"
        onClick={() => setCount((c) => c + 1)}
      >
        Count is {count}
      </button>
    </div>
  );
}

export default App;
