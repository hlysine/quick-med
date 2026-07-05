import { createFileRoute } from '@tanstack/react-router';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { FaPlus } from 'react-icons/fa';
import { cn } from '../utils/uiUtils';

type Urgency = 'high' | 'mid' | 'low';

interface TodoItem {
  id: string;
  text: string;
  urgency: Urgency;
  createdAt: number;
  done: boolean;
}

const STORAGE_KEY = 'quickmed-todos';

function loadTodos(): TodoItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (item: unknown): item is TodoItem =>
          typeof item === 'object' &&
          item !== null &&
          'id' in item &&
          'text' in item &&
          'urgency' in item &&
          'createdAt' in item &&
          typeof item.id === 'string' &&
          typeof item.text === 'string' &&
          (item.urgency === 'high' ||
            item.urgency === 'mid' ||
            item.urgency === 'low') &&
          typeof item.createdAt === 'number'
      )
      .map(item => ({ ...item, done: Boolean(item.done) }));
  } catch {
    return [];
  }
}

function saveTodos(todos: TodoItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
}

const URGENCY_ORDER: Record<Urgency, number> = { high: 0, mid: 1, low: 2 };

const URGENCY_BADGE: Record<Urgency, string> = {
  high: 'badge-error',
  mid: 'badge-warning',
  low: 'badge-info',
};

const URGENCY_BTN: Record<Urgency, string> = {
  high: 'btn-error',
  mid: 'btn-warning',
  low: 'btn-info',
};

const URGENCY_LABEL: Record<Urgency, string> = {
  high: 'High',
  mid: 'Mid',
  low: 'Low',
};

type SortMode = 'entry' | 'urgency';

// ── TodoRow ──────────────────────────────────────────────────────────────────

interface TodoRowProps {
  todo: TodoItem;
  expanded: boolean;
  onExpand: () => void;
  onCollapse: () => void;
  onToggleDone: () => void;
  onUpdateText: (val: string) => void;
  onUpdateUrgency: (u: Urgency) => void;
  onRemove: () => void;
}

function TodoRow({
  todo,
  expanded,
  onExpand,
  onCollapse,
  onToggleDone,
  onUpdateText,
  onUpdateUrgency,
  onRemove,
}: TodoRowProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  // Prevents onBlur from collapsing when tapping interactive elements inside the row
  const stayRef = useRef(false);

  const keepFocus = () => {
    stayRef.current = true;
  };
  const refocus = () => {
    inputRef.current?.focus();
  };

  if (expanded) {
    return (
      <li
        data-id={todo.id}
        className="flex flex-col gap-2 px-3 py-2.5 bg-base-200"
      >
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            className="checkbox checkbox-sm shrink-0"
            checked={todo.done}
            onPointerDown={keepFocus}
            onChange={() => {
              onToggleDone();
              refocus();
            }}
          />
          <input
            ref={inputRef}
            type="text"
            className="input input-sm input-bordered flex-1 min-w-0"
            value={todo.text}
            onChange={e => onUpdateText(e.target.value)}
            onBlur={() => {
              if (!stayRef.current) onCollapse();
              stayRef.current = false;
            }}
            onKeyDown={e => {
              if (e.key === 'Enter' || e.key === 'Escape') onCollapse();
            }}
            autoFocus
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
          />
          <button
            type="button"
            className="btn btn-ghost btn-sm text-base-content/30 hover:text-error shrink-0"
            onPointerDown={keepFocus}
            onClick={onRemove}
            aria-label="Remove task"
          >
            ✕
          </button>
        </div>
        <div className="flex gap-1">
          {(['high', 'mid', 'low'] as Urgency[]).map(u => (
            <button
              key={u}
              type="button"
              className={cn(
                'btn btn-xs flex-1',
                todo.urgency === u ? URGENCY_BTN[u] : 'btn-ghost opacity-40'
              )}
              onPointerDown={keepFocus}
              onClick={() => {
                onUpdateUrgency(u);
                refocus();
              }}
            >
              {URGENCY_LABEL[u]}
            </button>
          ))}
        </div>
      </li>
    );
  }

  return (
    <li
      data-id={todo.id}
      className="flex items-center gap-2 px-3 py-3 hover:bg-base-200 active:bg-base-300 transition-colors"
      onClick={onExpand}
    >
      <input
        type="checkbox"
        className="checkbox checkbox-sm shrink-0"
        checked={todo.done}
        onChange={onToggleDone}
        onClick={e => e.stopPropagation()}
      />
      <span
        className={cn(
          'badge badge-sm shrink-0 w-10 justify-center',
          URGENCY_BADGE[todo.urgency]
        )}
      >
        {URGENCY_LABEL[todo.urgency]}
      </span>
      <span
        className={cn(
          'flex-1 text-base leading-snug wrap-break-word min-w-0',
          todo.done && 'line-through opacity-40'
        )}
      >
        {todo.text}
      </span>
      <span className="text-xs text-base-content/30 shrink-0 tabular-nums">
        {new Date(todo.createdAt).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        })}
      </span>
      <button
        type="button"
        className="btn btn-ghost btn-sm text-base-content/30 hover:text-error shrink-0 -mr-1"
        onClick={e => {
          e.stopPropagation();
          onRemove();
        }}
        aria-label="Remove task"
      >
        ✕
      </button>
    </li>
  );
}

// ── TodoPage ──────────────────────────────────────────────────────────────────

function TodoPage() {
  const [todos, setTodos] = useState<TodoItem[]>(loadTodos);
  const [text, setText] = useState(localStorage.getItem('todo-text') ?? '');
  const [sort, setSort] = useState<SortMode>('entry');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const collapseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showClearModal, setShowClearModal] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const clearModalRef = useRef<HTMLDialogElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  // Snapshot of each item's top position from the previous render
  const prevPositions = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    saveTodos(todos);
  }, [todos]);

  useEffect(() => {
    localStorage.setItem('todo-text', text);
  }, [text]);

  useEffect(() => {
    if (showClearModal) clearModalRef.current?.showModal();
  }, [showClearModal]);

  const addTodo = useCallback(
    (u: Urgency) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      setTodos(prev => [
        ...prev,
        {
          id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
          text: trimmed,
          urgency: u,
          createdAt: Date.now(),
          done: false,
        },
      ]);
      setText('');
      inputRef.current?.focus();
    },
    [text]
  );

  const removeTodo = useCallback((id: string) => {
    setTodos(prev => prev.filter(t => t.id !== id));
    setExpandedId(prev => (prev === id ? null : prev));
  }, []);

  const updateTodo = useCallback(
    <K extends keyof TodoItem>(id: string, key: K, val: TodoItem[K]) => {
      setTodos(prev => prev.map(t => (t.id === id ? { ...t, [key]: val } : t)));
    },
    []
  );

  const clearAll = useCallback(() => {
    setTodos([]);
    setExpandedId(null);
    setShowClearModal(false);
  }, []);

  const sorted = useMemo(
    () =>
      [...todos].sort((a, b) => {
        if (a.done !== b.done) return a.done ? 1 : -1;
        if (sort === 'entry') {
          if (a.done) return b.createdAt - a.createdAt;
          else return a.createdAt - b.createdAt;
        }
        const urgencyDiff = URGENCY_ORDER[a.urgency] - URGENCY_ORDER[b.urgency];
        return urgencyDiff !== 0 ? urgencyDiff : a.text.localeCompare(b.text);
      }),
    [todos, sort]
  );

  // FLIP: after each render, animate items from their old positions to their new ones
  useLayoutEffect(() => {
    const list = listRef.current;
    if (!list) return;

    const items = list.querySelectorAll<HTMLElement>('[data-id]');
    const newPositions = new Map<string, number>();
    items.forEach(el =>
      newPositions.set(el.dataset.id!, el.getBoundingClientRect().top)
    );

    items.forEach(el => {
      const id = el.dataset.id!;
      const prev = prevPositions.current.get(id);
      const next = newPositions.get(id)!;
      if (prev === undefined || Math.abs(prev - next) < 1) return;

      const delta = prev - next;
      el.style.transition = 'none';
      el.style.transform = `translateY(${delta}px)`;
      el.getBoundingClientRect(); // force reflow
      el.style.transition = 'transform 100ms ease-out';
      el.style.transform = '';
      const onEnd = () => {
        el.style.transition = '';
        el.removeEventListener('transitionend', onEnd);
      };
      el.addEventListener('transitionend', onEnd);
    });

    prevPositions.current = newPositions;
  }, [sorted]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden w-full max-w-250 self-center">
      {/* Controls row */}
      <div className="flex items-center justify-between px-2 py-1 bg-base-100 border-b border-base-300">
        <div className="flex gap-1">
          {(['entry', 'urgency'] as SortMode[]).map(mode => (
            <button
              key={mode}
              type="button"
              className={cn(
                'btn btn-sm btn-ghost',
                sort === mode && 'btn-active'
              )}
              onClick={() => setSort(mode)}
            >
              {mode === 'entry' ? 'By time' : 'By urgency'}
            </button>
          ))}
        </div>
        <button
          type="button"
          className={cn(
            'btn btn-sm btn-ghost text-error',
            todos.length === 0 && 'btn-disabled opacity-40'
          )}
          onClick={() => {
            if (todos.length > 0) setShowClearModal(true);
          }}
        >
          Clear all
        </button>
      </div>

      {/* Task list */}
      <div className="flex-1 overflow-y-auto">
        {sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-base-content/40">
            <span className="text-4xl">✓</span>
            <span className="text-sm">No tasks</span>
          </div>
        ) : (
          <ul ref={listRef} className="divide-y divide-base-200">
            {sorted.map(todo => (
              <TodoRow
                key={todo.id}
                todo={todo}
                expanded={expandedId === todo.id}
                onExpand={() => {
                  if (collapseTimerRef.current) {
                    clearTimeout(collapseTimerRef.current);
                    collapseTimerRef.current = null;
                  }
                  setExpandedId(todo.id);
                }}
                onCollapse={() => {
                  collapseTimerRef.current = setTimeout(
                    () => setExpandedId(null),
                    0
                  );
                }}
                onToggleDone={() => updateTodo(todo.id, 'done', !todo.done)}
                onUpdateText={val => updateTodo(todo.id, 'text', val)}
                onUpdateUrgency={u => updateTodo(todo.id, 'urgency', u)}
                onRemove={() => removeTodo(todo.id)}
              />
            ))}
          </ul>
        )}
      </div>

      {/* Add task bar — pinned above keyboard */}
      <div className="flex flex-col gap-1.5 p-2 bg-base-200 border-t border-x border-base-300">
        <input
          ref={inputRef}
          type="text"
          className="input input-bordered w-full"
          placeholder="New task..."
          value={text}
          onInput={e => setText(e.currentTarget.value)}
          onFocus={e => e.currentTarget.select()}
          onKeyDown={e => {
            if (e.key === 'Enter' && text.trim()) addTodo('mid');
          }}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          autoFocus
        />
        <div className="flex gap-1">
          {(['high', 'mid', 'low'] as Urgency[]).map(u => (
            <button
              key={u}
              type="button"
              className={cn(
                'btn btn-sm flex-1 gap-1',
                URGENCY_BADGE[u],
                !text.trim() && 'opacity-40 pointer-events-none'
              )}
              onClick={() => addTodo(u)}
            >
              <FaPlus className="text-xs" />
              {URGENCY_LABEL[u]}
            </button>
          ))}
        </div>
      </div>

      {/* Clear all confirmation modal */}
      <dialog
        ref={clearModalRef}
        className="modal"
        onClose={() => setShowClearModal(false)}
      >
        <div className="modal-box">
          <p className="font-semibold">Clear all tasks?</p>
          <p className="text-sm text-base-content/60 mt-1">
            {todos.length} task{todos.length !== 1 ? 's' : ''} will be removed.
            This cannot be undone.
          </p>
          <div className="modal-action">
            <form method="dialog">
              <button className="btn btn-error" onClick={clearAll}>
                Clear all
              </button>
            </form>
            <form method="dialog">
              <button className="btn">Cancel</button>
            </form>
          </div>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>
    </div>
  );
}

export const Route = createFileRoute('/todo')({
  component: TodoPage,
});
