import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import type { FileEntry } from "@/types";
import { getBackend } from "@/backend";
import { padLeft, connectorLeft, ConnectorLines } from "./tree-shared";
import {
  ChevronIcon,
  FolderIcon,
  FileIcon,
  ImageIcon,
  HeicBadge,
} from "./icons";

// --- Types ---

export interface FileTreeNode {
  name: string;
  path: string;
  fileType: "file" | "directory" | "symlink";
  extension: string;
  isImage: boolean;
  isHeic: boolean;
  children: FileTreeNode[];
  isLoaded: boolean;
}

export interface FileTreeProps {
  rootPath: string;
  selectedPath: string | null;
  onSelect: (path: string) => void;
}

// --- Session storage persistence ---

const STORAGE_KEY = "zfv-tree-open";

function getOpenSet(): Set<string> {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed)
      ? new Set(parsed.filter((v): v is string => typeof v === "string"))
      : new Set();
  } catch {
    return new Set();
  }
}

function saveOpenSet(set: Set<string>) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify([...set]));
  } catch {
    // ignore
  }
}

// --- Tree helpers ---

function entriesToNodes(entries: FileEntry[]): FileTreeNode[] {
  const sorted = [...entries].sort((a, b) => {
    if (a.fileType === "directory" && b.fileType !== "directory") return -1;
    if (a.fileType !== "directory" && b.fileType === "directory") return 1;
    return a.name.localeCompare(b.name);
  });
  return sorted.map((entry) => ({
    name: entry.name,
    path: entry.path,
    fileType: entry.fileType,
    extension: entry.extension,
    isImage: entry.isImage,
    isHeic: entry.isHeic,
    children: [],
    isLoaded: entry.fileType !== "directory",
  }));
}

function updateNodeInTree(
  nodes: FileTreeNode[],
  targetPath: string,
  updater: (node: FileTreeNode) => FileTreeNode,
): FileTreeNode[] {
  return nodes.map((node) => {
    if (node.path === targetPath) return updater(node);
    if (node.children.length > 0) {
      const updated = updateNodeInTree(node.children, targetPath, updater);
      if (updated !== node.children) return { ...node, children: updated };
    }
    return node;
  });
}

function findNode(
  nodes: FileTreeNode[],
  targetPath: string,
): FileTreeNode | undefined {
  for (const node of nodes) {
    if (node.path === targetPath) return node;
    const found = findNode(node.children, targetPath);
    if (found) return found;
  }
  return undefined;
}

function filterTree(nodes: FileTreeNode[], query: string): FileTreeNode[] {
  if (!query) return nodes;
  const lowerQuery = query.toLowerCase();
  return nodes.reduce<FileTreeNode[]>((acc, node) => {
    const matchesName = node.name.toLowerCase().includes(lowerQuery);
    const filteredChildren =
      node.children.length > 0 ? filterTree(node.children, query) : [];
    if (matchesName || filteredChildren.length > 0) {
      acc.push({
        ...node,
        children: matchesName ? node.children : filteredChildren,
      });
    }
    return acc;
  }, []);
}

// --- Main component ---

export default function FileTree({
  rootPath,
  selectedPath,
  onSelect,
}: FileTreeProps) {
  const [nodes, setNodes] = useState<FileTreeNode[]>([]);
  const [openPaths, setOpenPaths] = useState<Set<string>>(() => getOpenSet());
  const [query, setQuery] = useState("");
  const filterRef = useRef<HTMLInputElement>(null);
  const nodesRef = useRef(nodes);
  nodesRef.current = nodes;
  const inFlightRef = useRef<Set<string>>(new Set());

  // Load root entries when rootPath changes
  useEffect(() => {
    if (!rootPath) return;
    let cancelled = false;
    getBackend()
      .files.listDirectory(rootPath)
      .then((entries) => {
        if (!cancelled) setNodes(entriesToNodes(entries));
      })
      .catch((err) => {
        console.error("Failed to load root directory:", err);
      });
    return () => {
      cancelled = true;
    };
  }, [rootPath]);

  // Toggle directory expand/collapse with lazy loading
  const toggleDir = useCallback(async (dirPath: string) => {
    setOpenPaths((prev) => {
      const next = new Set(prev);
      if (next.has(dirPath)) {
        next.delete(dirPath);
      } else {
        next.add(dirPath);
      }
      saveOpenSet(next);
      return next;
    });

    const node = findNode(nodesRef.current, dirPath);
    if (node && !node.isLoaded && !inFlightRef.current.has(dirPath)) {
      inFlightRef.current.add(dirPath);
      try {
        const entries = await getBackend().files.listDirectory(dirPath);
        const children = entriesToNodes(entries);
        setNodes((prev) =>
          updateNodeInTree(prev, dirPath, (n) => ({
            ...n,
            children,
            isLoaded: true,
          })),
        );
      } catch (err) {
        console.error("Failed to load directory:", err);
      } finally {
        inFlightRef.current.delete(dirPath);
      }
    }
  }, []);

  const filteredNodes = useMemo(
    () => filterTree(nodes, query),
    [nodes, query],
  );

  // Keyboard shortcut: Ctrl+/ or Cmd+/ to focus filter
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.isComposing) return;
      if (e.key === "/" && (e.metaKey || e.ctrlKey)) {
        const el = filterRef.current;
        if (!el) return;
        e.preventDefault();
        el.focus();
        el.select();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <nav className="h-full overflow-y-auto" aria-label="File tree">
      <div className="px-hsp-sm py-vsp-xs">
        <div className="flex items-center gap-hsp-xs rounded bg-surface px-hsp-sm py-vsp-2xs">
          <svg
            className="h-[14px] w-[14px] shrink-0 text-muted"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            ref={filterRef}
            type="text"
            placeholder="Filter..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-small outline-none text-fg placeholder:text-muted"
          />
        </div>
      </div>

      <NodeList
        nodes={filteredNodes}
        selectedPath={selectedPath}
        openPaths={openPaths}
        onToggle={toggleDir}
        onSelect={onSelect}
        depth={0}
        forceOpen={!!query}
      />
    </nav>
  );
}

// --- NodeList ---

function NodeList({
  nodes,
  selectedPath,
  openPaths,
  onToggle,
  onSelect,
  depth,
  forceOpen,
}: {
  nodes: FileTreeNode[];
  selectedPath: string | null;
  openPaths: Set<string>;
  onToggle: (path: string) => void;
  onSelect: (path: string) => void;
  depth: number;
  forceOpen: boolean;
}) {
  return (
    <ul role={depth === 0 ? "tree" : "group"} className="list-none p-0 m-0">
      {nodes.map((node, index) => {
        const isLast = index === nodes.length - 1;
        return node.fileType === "directory" ? (
          <DirectoryNode
            key={node.path}
            node={node}
            selectedPath={selectedPath}
            openPaths={openPaths}
            onToggle={onToggle}
            onSelect={onSelect}
            depth={depth}
            isLast={isLast}
            forceOpen={forceOpen}
          />
        ) : (
          <FileNode
            key={node.path}
            node={node}
            isSelected={node.path === selectedPath}
            onSelect={onSelect}
            depth={depth}
            isLast={isLast}
          />
        );
      })}
    </ul>
  );
}

// --- DirectoryNode ---

function DirectoryNode({
  node,
  selectedPath,
  openPaths,
  onToggle,
  onSelect,
  depth,
  isLast,
  forceOpen,
}: {
  node: FileTreeNode;
  selectedPath: string | null;
  openPaths: Set<string>;
  onToggle: (path: string) => void;
  onSelect: (path: string) => void;
  depth: number;
  isLast: boolean;
  forceOpen: boolean;
}) {
  const isExpanded = forceOpen || openPaths.has(node.path);
  const paddingLeft = padLeft(depth);

  return (
    <div className={depth >= 1 && !isLast ? "relative" : ""}>
      {/* Vertical connector for non-last expanded items */}
      {depth >= 1 && !isLast && isExpanded && (
        <div
          className="absolute z-10 border-l border-solid border-muted"
          style={{
            left: connectorLeft(depth),
            top: 0,
            bottom: 0,
          }}
        />
      )}

      <div className="relative">
        <ConnectorLines depth={depth} isLast={isLast} />
        <button
          type="button"
          onClick={() => onToggle(node.path)}
          className="flex w-full items-center gap-hsp-xs py-vsp-xs text-small font-semibold text-fg hover:underline focus:underline"
          style={{ paddingLeft }}
          aria-expanded={isExpanded}
          aria-label={
            isExpanded ? `Collapse ${node.name}` : `Expand ${node.name}`
          }
        >
          <ChevronIcon isExpanded={isExpanded} className="text-muted" />
          <FolderIcon isOpen={isExpanded} className="text-accent" />
          <span className="truncate">{node.name}</span>
        </button>
      </div>

      {isExpanded && (
        <div>
          <NodeList
            nodes={node.children}
            selectedPath={selectedPath}
            openPaths={openPaths}
            onToggle={onToggle}
            onSelect={onSelect}
            depth={depth + 1}
            forceOpen={forceOpen}
          />
          {!node.isLoaded && (
            <div
              className="py-vsp-2xs text-caption text-muted"
              style={{ paddingLeft: padLeft(depth + 1) }}
            >
              Loading...
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// --- FileNode ---

function FileNode({
  node,
  isSelected,
  onSelect,
  depth,
  isLast,
}: {
  node: FileTreeNode;
  isSelected: boolean;
  onSelect: (path: string) => void;
  depth: number;
  isLast: boolean;
}) {
  const paddingLeft = padLeft(depth);

  return (
    <div className="relative">
      <ConnectorLines depth={depth} isLast={isLast} />
      <button
        type="button"
        onClick={() => onSelect(node.path)}
        className={`flex w-full items-center gap-hsp-xs py-vsp-2xs text-small ${
          isSelected
            ? "bg-fg font-medium text-bg"
            : "text-muted hover:underline focus:underline"
        }`}
        style={{ paddingLeft }}
        role="treeitem"
        aria-selected={isSelected}
      >
        <FileNodeIcon node={node} isSelected={isSelected} />
        <span className="truncate">{node.name}</span>
        {node.isHeic && <HeicBadge />}
      </button>
    </div>
  );
}

function FileNodeIcon({
  node,
  isSelected,
}: {
  node: FileTreeNode;
  isSelected: boolean;
}) {
  if (node.isImage) {
    return (
      <ImageIcon className={isSelected ? "text-bg" : "text-accent"} />
    );
  }
  return <FileIcon className={isSelected ? "text-bg" : "text-muted"} />;
}
