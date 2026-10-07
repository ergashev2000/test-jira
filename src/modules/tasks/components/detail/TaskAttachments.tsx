import { HugeiconsIcon } from '@hugeicons/react';
import { CloudUploadIcon, Download01Icon, File01Icon, Pdf01Icon, Zip01Icon } from '@hugeicons/core-free-icons';
import { useQueryClient } from '@tanstack/react-query';
import { App, Button, Image, Skeleton, Upload } from 'antd';
import { useEffect, useMemo, useState } from 'react';

import { useAppSettings } from '@/modules/settings';
import { QueryState } from '@/shared/components/ui';
import { QUERY_KEYS } from '@/shared/constants';
import type { Attachment } from '@/shared/types';
import { errorMessage, formatFileSize, fromNow } from '@/shared/utils';

import { downloadAttachment } from '../../api/taskActionsApi';
import { useAttachmentFile, useAttachments, useUploadAttachment } from '../../hooks/useTaskActions';

const isImage = (a: Attachment) => a.mime_type.startsWith('image/');

/** Object URL for a blob, revoked when the blob changes or the component unmounts. */
const useObjectUrl = (blob: Blob | undefined) => {
  const url = useMemo(() => (blob instanceof Blob ? URL.createObjectURL(blob) : undefined), [blob]);
  useEffect(() => () => { if (url) URL.revokeObjectURL(url); }, [url]);
  return url;
};

/** Saves a blob under the attachment's original name. */
const saveBlob = (blob: Blob, name: string) => {
  const url = URL.createObjectURL(blob);
  const link = Object.assign(document.createElement('a'), { href: url, download: name });
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

const GenericIcon = ({ a }: { a: Attachment }) => {
  const icon = a.file_name.endsWith('.pdf') ? Pdf01Icon : a.file_name.endsWith('.zip') ? Zip01Icon : File01Icon;
  return <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded bg-surface-2 text-base text-fg-2"><HugeiconsIcon icon={icon} size={16} className="hicon" strokeWidth={1.7} /></span>;
};

/** Images are loaded through the download endpoint when the task opens (it needs the token). */
const ImageThumb = ({ taskId, a }: { taskId: number; a: Attachment }) => {
  const file = useAttachmentFile(taskId, a.id);
  const src = useObjectUrl(file.data);
  if (!src) return file.isLoading ? <Skeleton.Image active className="!h-9 !w-9" /> : <GenericIcon a={a} />;
  return <Image src={src} width={36} height={36} className="rounded object-cover" preview={{ mask: false }} />;
};

const DownloadButton = ({ taskId, a }: { taskId: number; a: Attachment }) => {
  const { message } = App.useApp();
  const qc = useQueryClient();
  const [loading, setLoading] = useState(false);
  const download = async () => {
    setLoading(true);
    try {
      const blob = await qc.fetchQuery({
        queryKey: [...QUERY_KEYS.tasks.attachments(String(taskId)), 'file', a.id],
        queryFn: () => downloadAttachment(taskId, a.id),
        staleTime: Infinity,
      });
      saveBlob(blob, a.file_name);
    } catch (e) {
      message.error(errorMessage(e));
    } finally {
      setLoading(false);
    }
  };
  return <Button type="text" size="small" loading={loading} icon={<HugeiconsIcon icon={Download01Icon} size={16} className="hicon" strokeWidth={1.7} />} onClick={download} />;
};

export const TaskAttachments = ({ taskId, disabled }: { taskId: number; disabled?: boolean }) => {
  const { message } = App.useApp();
  const query = useAttachments(taskId);
  const upload = useUploadAttachment();
  const { data: settings } = useAppSettings();
  const maxMb = settings?.tasks?.max_attachment_mb ?? 10;
  const types = settings?.tasks?.allowed_file_types ?? [];

  return (
    <div className="flex flex-col gap-3">
      {!disabled && (
        <Upload.Dragger
          multiple
          showUploadList={false}
          accept={types.map((t) => `.${t}`).join(',')}
          beforeUpload={(file) => {
            const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
            if (types.length && !types.includes(ext)) message.error(`.${ext} files are not allowed`);
            else if (file.size > maxMb * 1024 * 1024) message.error(`${file.name} is larger than ${maxMb} MB`);
            else upload.mutate({ taskId, file }, { onSuccess: () => message.success(`${file.name} uploaded`), onError: (e) => message.error(errorMessage(e)) });
            return false;
          }}
          className="!bg-transparent"
        >
          <div className="flex items-center justify-center gap-3 py-1 text-fg-2">
            <HugeiconsIcon icon={CloudUploadIcon} size={16} className="hicon text-lg" strokeWidth={1.7} />
            <span className="text-xs">Drop files or click to upload · {types.join(', ')} · max {maxMb} MB</span>
          </div>
        </Upload.Dragger>
      )}
      <QueryState query={query} skeletonRows={1} isEmpty={(d) => !d.length} empty={<span className="text-xs text-fg-3">No attachments</span>}>
        {(d) => (
          <Image.PreviewGroup>
            <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
              {d.map((a) => (
                <li key={a.id} className="flex items-center gap-3 rounded-md border border-line bg-surface px-2.5 py-1.5">
                  {isImage(a) ? <ImageThumb taskId={taskId} a={a} /> : <GenericIcon a={a} />}
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] text-fg">{a.file_name}</div>
                    <div className="text-[11px] text-fg-3">
                      {formatFileSize(a.file_size)} · {a.uploaded_by?.full_name} · {fromNow(a.created_at)}
                    </div>
                  </div>
                  <DownloadButton taskId={taskId} a={a} />
                </li>
              ))}
            </ul>
          </Image.PreviewGroup>
        )}
      </QueryState>
    </div>
  );
};
