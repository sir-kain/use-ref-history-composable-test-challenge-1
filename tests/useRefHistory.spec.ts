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
