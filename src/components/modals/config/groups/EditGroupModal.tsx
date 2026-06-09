import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { useAppDispatch } from '../../../../hooks/stateHooks';
import { setGroupDetail, upsertGroup } from '../../../../redux/rootSlice';
import { updateGroup } from '../../../../utilities/api/groups';
import { Group } from '../../../../utilities/api/types';
import { sectionLabel, inputClass, primaryBtn, ghostBtn } from '../cloud/styles';
import { apiErrToast } from '../cloud/helpers';
import NestedSheet from '../cloud/NestedSheet';

const EditGroupModal: React.FC<{
    group: Group;
    onClose: () => void;
}> = ({ group, onClose }) => {
    const dispatch = useAppDispatch();
    const [name, setName] = useState(group.name);
    const [description, setDescription] = useState(group.description ?? '');
    const [imageUrl, setImageUrl] = useState(group.image_url ?? '');
    const [saving, setSaving] = useState(false);

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = name.trim();
        if (!trimmed) {
            toast.error('Name is required.');
            return;
        }
        setSaving(true);
        try {
            const updated = await updateGroup(group.id, {
                name: trimmed,
                description: description.trim() || undefined,
                image_url: imageUrl.trim() || undefined,
            });
            // Preserve members from the prior detail since PATCH may not return them.
            dispatch(setGroupDetail({ ...updated, members: updated.members ?? group.members }));
            dispatch(upsertGroup({ ...updated, members: undefined }));
            toast.success('Saved.');
            onClose();
        } catch (e) {
            apiErrToast(e, 'Failed to update.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <NestedSheet onClose={onClose} title="Edit group">
            <form onSubmit={submit} className="space-y-3">
                <label className="block">
                    <span className={`${sectionLabel} block mb-1`}>Name</span>
                    <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} maxLength={100} autoFocus required />
                </label>
                <label className="block">
                    <span className={`${sectionLabel} block mb-1`}>Description</span>
                    <textarea className={`${inputClass} min-h-[60px]`} value={description} onChange={(e) => setDescription(e.target.value)} maxLength={500} />
                </label>
                <label className="block">
                    <span className={`${sectionLabel} block mb-1`}>Image URL</span>
                    <input className={inputClass} value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} maxLength={500} placeholder="https://…" type="url" />
                </label>
                <div className="flex justify-end gap-2 pt-1">
                    <button type="button" onClick={onClose} className={ghostBtn}>Cancel</button>
                    <button type="submit" disabled={saving} className={primaryBtn}>
                        {saving ? 'Saving…' : 'Save'}
                    </button>
                </div>
            </form>
        </NestedSheet>
    );
};

export default EditGroupModal;
