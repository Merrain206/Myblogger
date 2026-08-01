"use client";

import { useEffect, useRef, useCallback } from "react";
import { EditorState, Compartment, type Extension } from "@codemirror/state";
import { EditorView, keymap, lineNumbers } from "@codemirror/view";
import { python } from "@codemirror/lang-python";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";

interface CodeMirrorEditorProps {
  value: string;
  onChange?: (value: string) => void;
  onRun?: () => void;
  readOnly?: boolean;
  /** 编辑器最小高度 */
  minHeight?: string;
}

/**
 * CodeMirror 6 编辑器组件
 *
 * 为每个 CodeCell 独立实例化一个 EditorView。
 * 支持 Python 语法高亮、暗色模式跟随、Shift+Enter 运行。
 */
export default function CodeMirrorEditor({
  value,
  onChange,
  onRun,
  readOnly = false,
  minHeight = "60px",
}: CodeMirrorEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const editableCompartment = useRef(new Compartment());
  const onChangeRef = useRef(onChange);
  const onRunRef = useRef(onRun);

  // 保持回调引用最新
  onChangeRef.current = onChange;
  onRunRef.current = onRun;

  // Shift+Enter 运行快捷键
  const runKeymap = useCallback(() => {
    if (!onRun) return [];
    return keymap.of([
      {
        key: "Shift-Enter",
        run: () => {
          onRunRef.current?.();
          return true;
        },
      },
    ]);
  }, [onRun]);

  useEffect(() => {
    if (!containerRef.current) return;

    const extensions: Extension[] = [
      lineNumbers(),
      history(),
      python(),
      keymap.of([...defaultKeymap, ...historyKeymap]),
      EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          onChangeRef.current?.(update.state.doc.toString());
        }
      }),
      editableCompartment.current.of(EditorView.editable.of(!readOnly)),
      EditorView.theme({
        "&": { minHeight, fontSize: "14px" },
        ".cm-scroller": { overflow: "auto", fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace" },
        "&.cm-editor.cm-focused": { outline: "none" },
      }),
    ];

    if (onRun) {
      extensions.push(runKeymap());
    }

    const state = EditorState.create({
      doc: value,
      extensions,
    });

    const view = new EditorView({
      state,
      parent: containerRef.current,
    });

    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
    // 只在挂载时创建，value/readOnly 变化通过下面的 effect 同步
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 外部 value 变更时同步到编辑器
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;

    const currentValue = view.state.doc.toString();
    if (value !== currentValue) {
      view.dispatch({
        changes: { from: 0, to: view.state.doc.length, insert: value },
      });
    }
  }, [value]);

  // readOnly 切换
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    view.dispatch({
      effects: editableCompartment.current.reconfigure(EditorView.editable.of(!readOnly)),
    });
  }, [readOnly]);

  return (
    <div
      ref={containerRef}
      className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700"
    />
  );
}
