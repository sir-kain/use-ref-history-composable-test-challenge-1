import { describe, it, expect, beforeEach } from "vitest";
import { useRefHistory } from "../src/composables/useRefHistory";
import { ref, nextTick } from "vue";

interface HistoryRecord {
  value: string;
  timestamp: number;
}

describe("useRefHistory", () => {
  it("stores the history of the source value", async () => {
    const theme = ref("light");
    const { history } = useRefHistory(theme, ref(10));
    theme.value = "dark";
    await nextTick();
    expect(history.value).toHaveLength(1);
    theme.value = "coffee";
    await nextTick();
    expect(history.value[0].value).toBe('dark');
    theme.value = "dark";
    await nextTick();
    expect(history.value[0].value).toBe('coffee');
  });

  it("does NOT include the current value in history", async () => {
    const theme = ref("light");
    const { history } = useRefHistory(theme, ref(10));
    theme.value = "dark";
    await nextTick();
    expect(history.value).toHaveLength(1);
    expect(history.value[0].value).not.toBe('dark');
    expect(history.value.find(h => h.value === 'dark')).toBe(undefined);
  });

  it("stores the history ordered from newest to oldest", async () => {
    const theme = ref("light");
    const { history } = useRefHistory(theme, ref(10));
    const sources = ["dark", "coffee", "brown"]
    for (const source of sources) {
      theme.value = source;
      await nextTick();
    }
    expect(history.value).toHaveLength(3);
    expect(history.value[0].value).toBe('coffee');
    expect(history.value[1].value).toBe('dark');
    expect(history.value[2].value).toBe('light');
  });

  it(
    "removes the oldest record(s) when the history reaches the capacity",
    async () => {
      const theme = ref("light");
      const { history } = useRefHistory(theme, ref(2));
      const sources = ["dark", "coffee", "brown"]
      for (const source of sources) {
        theme.value = source;
        await nextTick();
      }
      expect(history.value).toHaveLength(2);
      expect(history.value[0].value).toBe('coffee');
      expect(history.value[1].value).toBe('dark');
      expect(history.value[history.value.length - 1].value).not.toBe('light');
    },
  );

  it.todo(
    "allows capacity as a getter (callback function) and dynamically update history when capacity changes",
    async () => {
      const theme = ref("light");
      const capacity = (n) => n;
      capacity(10)
      const { history } = useRefHistory(theme, capacity);
      const sources = ["dark", "coffee", "brown"]
      for (const source of sources) {
        theme.value = source;
        await nextTick();
      }
      expect(history.value).toHaveLength(3);
      expect(history.value[0].value).toBe('coffee');
      expect(history.value[1].value).toBe('dark');
      expect(history.value[2].value).toBe('light');

      capacity(2);
      await nextTick();
      expect(history.value).toHaveLength(2);
      expect(history.value[0].value).toBe('coffee');
      expect(history.value[1].value).toBe('dark');
      // expect(history.value[2].value).toBe('light');
    },
  );

  it(
    "allows capacity as a ref and dynamically update history when capacity changes",
    async () => {
      const theme = ref("light");
      const capacity = ref(10)
      const { history } = useRefHistory(theme, capacity);
      const sources = ["dark", "coffee", "brown"]
      for (const source of sources) {
        theme.value = source;
        await nextTick();
      }
      expect(history.value).toHaveLength(3);
      expect(history.value[0].value).toBe('coffee');
      expect(history.value[1].value).toBe('dark');
      expect(history.value[2].value).toBe('light');

      capacity.value = 2
      await nextTick();
      expect(history.value).toHaveLength(2);
      expect(history.value[0].value).toBe('coffee');
      expect(history.value[1].value).toBe('dark');
    },
  );

  it(
    "sets the data source back to the previous value on undo",
    async () => {
      const theme = ref("light");
      const capacity = ref(10)
      const { undo, history } = useRefHistory(theme, capacity);
      const sources = ["dark", "coffee", "brown"]
      for (const source of sources) {
        theme.value = source;
        await nextTick();
      }
      expect(history.value).toHaveLength(3);
      expect(history.value[0].value).toBe('coffee');
      expect(history.value[1].value).toBe('dark');
      expect(history.value[2].value).toBe('light');

      undo()
      await nextTick();
      expect(history.value).toHaveLength(2);
      expect(history.value[0].value).toBe('dark');
      expect(history.value[1].value).toBe('light');
    },
  );

  it(
    "sets the data source to one record forward in history on redo",
    async () => {
      const theme = ref("light");
      const capacity = ref(10)
      const { undo, redo, history } = useRefHistory(theme, capacity);
      const sources = ["dark", "coffee", "brown"]
      for (const source of sources) {
        theme.value = source;
        await nextTick();
      }
      expect(history.value).toHaveLength(3);
      expect(history.value[0].value).toBe('coffee');
      expect(history.value[1].value).toBe('dark');
      expect(history.value[2].value).toBe('light');

      undo()
      await nextTick();
      expect(history.value).toHaveLength(2);
      expect(history.value[0].value).toBe('dark');
      expect(history.value[1].value).toBe('light');

      redo()
      await nextTick();
      expect(history.value).toHaveLength(3);
      expect(history.value[0].value).toBe('coffee');
      expect(history.value[1].value).toBe('dark');
      expect(history.value[2].value).toBe('light');
    },
  );
});

describe("[CORRECTION] useRefHistory", () => {
  it("stores the history of the source value", async () => {
    const data = ref(0);
    const { history } = useRefHistory(data);

    // The history should be empty at the start
    expect(history.value.length).toBe(0);

    // Once we alter the source data once the history should have one record
    // with the value of 0 (which is the initial value of the source)
    data.value = 1;
    await nextTick();
    expect(history.value.at(0)?.value).toBe(0);

    // If we change the source data again, the history should have 2 records
    // with the value of 1 and 0
    data.value = 2;
    await nextTick();

    expect(history.value.at(0)?.value).toBe(1);
    expect(history.value.at(1)?.value).toBe(0);
  });

  it("does NOT include the current value in history", async () => {
    const data = ref(0);
    const { history } = useRefHistory(data);

    data.value = 1;
    await nextTick();

    expect(history.value.at(0)?.value).toBe(0);
  });

  it("stores the history ordered from newest to oldest", async () => {
    const data = ref(0);
    const { history } = useRefHistory(data);

    // The history should be empty at the start
    // so let's add some records to seed the test
    for (let i = 1; i < 6; i++) {
      data.value = i;
      await nextTick();
    }

    // first in the list should be 4 (not 5 since we don't store the current value in history)
    expect(history.value.at(0)?.value).toBe(4);
    // last in the list should be the initial value (the oldest value: 0)
    expect(history.value.at(-1)?.value).toBe(0);
  });

  it("removes the oldest record(s) when the history reaches the capacity", async () => {
    const data = ref(0);
    const { history } = useRefHistory(data, 3);

    // load up with more than the capacity
    for (let i = 1; i < 6; i++) {
      data.value = i;
      await nextTick();
    }

    // the history should only have 3 records as that's the capacity
    expect(history.value.length).toBe(3);

    // the first record should be since it's the latest
    expect(history.value.at(0)?.value).toBe(4);

    // the last record shouldn't be the initial value since it's been removed
    // instead it's the oldest value that's still in the history
    expect(history.value.at(-1)?.value).toBe(2);
  });

  it("allows capacity as a getter (callback function) and dynamically update history when capacity changes", async () => {
    const data = ref(0);
    const capacity = ref(3);
    const { history } = useRefHistory(data, () => capacity.value);

    // load up with more than the capacity
    for (let i = 1; i < 6; i++) {
      data.value = i;
      await nextTick();
    }

    // sanity check that the history is at capacity
    expect(history.value.length).toBe(3);

    // change the capacity to 2
    // the history should now only have 2 records
    capacity.value = 2;
    await nextTick();
    expect(history.value.length).toBe(2);
  });

  it("allows capacity as a ref and dynamically update history when capacity changes", async () => {
    const data = ref(0);
    const capacity = ref(3);
    const { history } = useRefHistory(data, capacity);

    // load up with more than the capacity
    for (let i = 1; i < 6; i++) {
      data.value = i;
      await nextTick();
    }

    // sanity check that the history is at capacity
    expect(history.value.length).toBe(3);

    // change the capacity to 2
    // the history should now only have 2 records
    capacity.value = 2;
    await nextTick();
    expect(history.value.length).toBe(2);
  });

  it("sets the data source back to the previous value on undo", async () => {
    const data = ref(0);
    const { undo } = useRefHistory(data, 3);

    // set the data to 1
    data.value = 1;
    await nextTick();

    // sanity check that the data is 1
    expect(data.value).toBe(1);

    // undo the data back to 0
    undo();
    await nextTick();

    expect(data.value).toBe(0);
  });

  it("sets the data source to one record forward in history on redo", async () => {
    const data = ref(0);
    const { undo, redo } = useRefHistory(data, 3);
    // update the data to 1
    data.value = 1;
    await nextTick();

    // undo back to 0
    undo();
    await nextTick();

    // redo again to 1
    redo();
    await nextTick();

    expect(data.value).toBe(1);
  });
});
