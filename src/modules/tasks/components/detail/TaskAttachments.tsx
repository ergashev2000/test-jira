import { HugeiconsIcon } from '@hugeicons/react';
import { CloudUploadIcon, Download01Icon, File01Icon, Pdf01Icon, Zip01Icon } from '@hugeicons/core-free-icons';
import { App, Button, Image, Upload } from 'antd';

import { useAppSettings } from '@/modules/settings';
import { QueryState } from '@/shared/components/ui';
import type { Attachment } from '@/shared/types';
import { errorMessage, formatFileSize, fromNow } from '@/shared/utils';

import { useAttachments, useUploadAttachment } from '../../hooks/useTaskActions';

const FileIcon = ({ a }: { a: Attachment }) => {
  if (a.mime_type.startsWith('image/')) {
    return <Image src={a.url} width={36} height={36} className="rounded object-cover" preview={{ mask: false }} />;
  }
  const icon = a.file_name.endsWith('.pdf') ? Pdf01Icon : a.file_name.endsWith('.zip') ? Zip01Icon : File01Icon;
  return <span className="flex h-9 w-9 items-center justify-center rounded bg-surface-2 text-base text-fg-2"><HugeiconsIcon icon={icon} size={16} className="hicon" strokeWidth={1.7} /></span>;
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
                  <FileIcon a={a} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] text-fg">{a.file_name}</div>
                    <div className="text-[11px] text-fg-3">
                      {formatFileSize(a.file_size)} · {a.uploaded_by?.full_name} · {fromNow(a.created_at)}
                    </div>
                  </div>
                  <Button type="text" size="small" icon={<HugeiconsIcon icon={Download01Icon} size={16} className="hicon" strokeWidth={1.7} />} href={a.url} download={a.file_name} />
                </li>
              ))}
            </ul>
          </Image.PreviewGroup>
        )}
      </QueryState>
    </div>
  );
};
