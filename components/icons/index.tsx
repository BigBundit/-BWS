import React from 'react';
import { GlobeAltIcon } from './GlobeAltIcon';
import { CodeBracketIcon } from './CodeBracketIcon';
import { CircleStackIcon } from './CircleStackIcon';
import { ChartBarIcon } from './ChartBarIcon';
import { DocumentTextIcon } from './DocumentTextIcon';
import { CogIcon } from './CogIcon';
import { PlusIcon } from './PlusIcon';
import { PencilIcon } from './PencilIcon';
import { TrashIcon } from './TrashIcon';
import { ChevronLeftIcon } from './ChevronLeftIcon';
import { ChevronRightIcon } from './ChevronRightIcon';
import { FolderOpenIcon } from './FolderOpenIcon';
import { CommandLineIcon } from './CommandLineIcon';
import { BugAntIcon } from './BugAntIcon';
import { VideoCameraIcon } from './VideoCameraIcon';
import { DocumentDuplicateIcon } from './DocumentDuplicateIcon';
import { DocumentChartBarIcon } from './DocumentChartBarIcon';
import { ArchiveBoxIcon } from './ArchiveBoxIcon';
import { ClipboardDocumentCheckIcon } from './ClipboardDocumentCheckIcon';
import { CalendarIcon } from './CalendarIcon';
import { PhotoIcon } from './PhotoIcon';
import { FileIcon } from './FileIcon';
import { ComputerDesktopIcon } from './ComputerDesktopIcon';
import { ArrowsPointingOutIcon } from './ArrowsPointingOutIcon';
import { ArrowsPointingInIcon } from './ArrowsPointingInIcon';
import { SparklesIcon } from './SparklesIcon';
import { BluetoothIcon } from './BluetoothIcon';
import { DocumentArrowDownIcon } from './DocumentArrowDownIcon';
import { MicrophoneIcon } from './MicrophoneIcon';
import { StopCircleIcon } from './StopCircleIcon';
import { ArrowUpCircleIcon } from './ArrowUpCircleIcon';


export {
    PlusIcon, PencilIcon, TrashIcon, ChevronLeftIcon, ChevronRightIcon, FolderOpenIcon, DocumentDuplicateIcon, CogIcon, CalendarIcon, ArrowsPointingOutIcon, ArrowsPointingInIcon, ClipboardDocumentCheckIcon,
    BluetoothIcon,
    // FIX: Export CodeBracketIcon so it can be imported by other components.
    CodeBracketIcon,
    PhotoIcon,
    FileIcon,
    DocumentTextIcon,
    DocumentArrowDownIcon,
    ComputerDesktopIcon,
    VideoCameraIcon,
    MicrophoneIcon,
    StopCircleIcon,
    SparklesIcon,
    ArrowUpCircleIcon,
};

type IconComponent = React.FC<React.SVGProps<SVGSVGElement>>;

export const ICONS: { [key: string]: IconComponent } = {
  GlobeAlt: GlobeAltIcon,
  CodeBracket: CodeBracketIcon,
  CircleStack: CircleStackIcon,
  ChartBar: ChartBarIcon,
  DocumentText: DocumentTextIcon,
  DocumentDuplicate: DocumentDuplicateIcon,
  DocumentChartBar: DocumentChartBarIcon,
  ClipboardDocumentCheck: ClipboardDocumentCheckIcon,
  FolderOpen: FolderOpenIcon,
  ArchiveBox: ArchiveBoxIcon,
  Cog: CogIcon,
  CommandLine: CommandLineIcon,
  BugAnt: BugAntIcon,
  VideoCamera: VideoCameraIcon,
  ComputerDesktop: ComputerDesktopIcon,
  Photo: PhotoIcon,
  File: FileIcon,
  Sparkles: SparklesIcon,
};

export const ICON_KEYS = Object.keys(ICONS);