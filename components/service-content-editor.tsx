"use client";
import { useRef, useState } from "react";
import Image from "next/image";
import { ArrowDown, ArrowUp, Link2, LoaderCircle, Plus, Trash2, Upload } from "lucide-react";
const styles = {
  "editor": "serviceEditor_editor",
  "gallery": "serviceEditor_gallery",
  "heading": "serviceEditor_heading",
  "count": "serviceEditor_count",
  "hint": "serviceEditor_hint",
  "imageEntry": "serviceEditor_imageEntry",
  "imageHeader": "serviceEditor_imageHeader",
  "thumbnail": "serviceEditor_thumbnail",
  "imageInfo": "serviceEditor_imageInfo",
  "eyebrow": "serviceEditor_eyebrow",
  "field": "serviceEditor_field",
  "toolbar": "serviceEditor_toolbar",
  "orderButton": "serviceEditor_orderButton",
  "removeImage": "serviceEditor_removeImage",
  "uploadArea": "serviceEditor_uploadArea",
  "uploadButton": "serviceEditor_uploadButton",
  "actions": "serviceEditor_actions",
  "actionHeading": "serviceEditor_actionHeading",
  "actionRow": "serviceEditor_actionRow",
  "destination": "serviceEditor_destination",
  "removeAction": "serviceEditor_removeAction",
  "addAction": "serviceEditor_addAction"
};
import { actionTypes, actionLabels, type ServiceImage, type ServiceAction } from "@/lib/service-content";
import { MAX_IMAGE_BYTES } from "@/lib/image-upload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ServiceContentEditor({ businessId, initialImages = [], initialActions = [], onUploadingChange }: {
  businessId: string; initialImages?: ServiceImage[]; initialActions?: ServiceAction[]; onUploadingChange: (value: boolean) => void;
}) {
  const [images, setImages] = useState(initialImages);
  const [actions, setActions] = useState(initialActions);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  async function upload(file?: File) {
    if (!file) return;
    if (file.size > MAX_IMAGE_BYTES) { setError("Images must not exceed 2 MB"); return; }
    setUploading(true); onUploadingChange(true); setError("");
    try {
      const form = new FormData(); form.set("file", file);
      const response = await fetch(`/api/businesses/${businessId}/images`, { method: "POST", body: form });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to upload the image");
      setImages((current) => [...current, { id: result.id, url: result.url, description: "" }]);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Upload failed"); }
    finally { setUploading(false); onUploadingChange(false); }
  }
  return <div className={`${styles.editor} sm:col-span-2`}>
    <input type="hidden" name="images" value={JSON.stringify(images)} />
    <input type="hidden" name="actions" value={JSON.stringify(actions)} />
    <fieldset disabled={uploading} className={styles.gallery}>
      <legend className={styles.heading}> Service gallery <span className={styles.count}>{images.length}/12</span></legend>
      <p className={styles.hint}>Bring your service to life with images. Arrange them in the order you want them displayed.</p>
      {images.map((image, index) => <div key={image.id} className={styles.imageEntry}>
        <div className={styles.imageHeader}>
          <Image src={image.url} alt={image.description || "Preview"} width={160} height={120} unoptimized className={styles.thumbnail} />
          <div className={styles.imageInfo}>
            <span className={styles.eyebrow}>Image {String(index + 1).padStart(2, "0")}</span>
            <label className={styles.field}>Image description<Input value={image.description} maxLength={500} placeholder="Describe what this image shows…" onChange={(event) => setImages(images.map((item) => item.id === image.id ? { ...item, description: event.target.value } : item))} /></label>
          </div>
        </div>
        <ActionsEditor title={`Links and contacts for image ${index + 1}`} actions={image.actions ?? []} onChange={(nextActions) => setImages(images.map((item) => item.id === image.id ? { ...item, actions: nextActions } : item))} />
        <div className={styles.toolbar}>
          <Button type="button" variant="ghost" size="sm" className={styles.orderButton} disabled={index === 0} aria-label={`Move image ${index + 1} up`} onClick={() => { const next = [...images]; [next[index - 1], next[index]] = [next[index], next[index - 1]]; setImages(next); }}><ArrowUp size={16} aria-hidden="true" /></Button>
          <Button type="button" variant="ghost" size="sm" className={styles.orderButton} disabled={index === images.length - 1} aria-label={`Move image ${index + 1} down`} onClick={() => { const next = [...images]; [next[index], next[index + 1]] = [next[index + 1], next[index]]; setImages(next); }}><ArrowDown size={16} aria-hidden="true" /></Button>
          <Button type="button" variant="ghost" size="sm" className={styles.removeImage} onClick={() => setImages(images.filter((item) => item.id !== image.id))}><Trash2 size={14} aria-hidden="true" /> Remove image</Button>
        </div>
      </div>)}
      {images.length < 12 ? <div className={styles.uploadArea}>
        <input ref={fileInput} type="file" className="hidden" aria-label="Upload image" accept="image/jpeg,image/png,image/webp" onChange={(event) => { void upload(event.target.files?.[0]); event.target.value = ""; }} />
        <Button type="button" className={styles.uploadButton} disabled={uploading} onClick={() => fileInput.current?.click()}>
          {uploading ? <LoaderCircle size={19} className="animate-spin" aria-hidden="true" /> : <Upload size={19} aria-hidden="true" />}
          {uploading ? "Uploading image…" : "Upload image from your device"}
        </Button>
        <p className={styles.hint}>JPEG, PNG or WebP · Maximum 2 MB per image</p>
      </div> : null}
    </fieldset>
    {uploading ? <p role="status">Uploading image… Please wait before saving.</p> : null}
    {error ? <p role="alert" className="text-sm text-red-700">{error}</p> : null}
    <ActionsEditor title="Service contacts, social media and links" actions={actions} onChange={setActions} />
  </div>;
}

function ActionsEditor({ title, actions, onChange }: { title: string; actions: ServiceAction[]; onChange: (actions: ServiceAction[]) => void }) {
  return (
    <fieldset className={styles.actions}>
      <legend className={styles.actionHeading}><Link2 size={15} aria-hidden="true" />{title}</legend>
      {actions.map((action) => <div key={action.id} className={styles.actionRow}>
        <label className={styles.field}>Type<select value={action.type} onChange={(event) => onChange(actions.map((item) => item.id === action.id ? { ...item, type: event.target.value as ServiceAction["type"] } : item))}>{actionTypes.map((type) => <option key={type} value={type}>{actionLabels[type]}</option>)}</select></label>
        <label className={styles.field}>Button label<Input required maxLength={80} value={action.label} onChange={(event) => onChange(actions.map((item) => item.id === action.id ? { ...item, label: event.target.value } : item))} /></label>
        <label className={`${styles.field} ${styles.destination}`}>Destination<Input required value={action.url} placeholder={action.type === "PHONE" ? "tel:+18095551234" : action.type === "EMAIL" ? "mailto:contact@business.com" : "https://..."} onChange={(event) => onChange(actions.map((item) => item.id === action.id ? { ...item, url: event.target.value } : item))} /></label>
        <Button type="button" variant="ghost" size="sm" className={styles.removeAction} onClick={() => onChange(actions.filter((item) => item.id !== action.id))}><Trash2 size={14} aria-hidden="true" /> Remove action</Button>
      </div>)}
      <Button type="button" variant="ghost" className={styles.addAction} disabled={actions.length >= 20} onClick={() => onChange([...actions, { id: crypto.randomUUID(), type: "LINK", label: "", url: "" }])}><Plus size={16} aria-hidden="true" /> Add contact or link</Button>
    </fieldset>
  );
}
