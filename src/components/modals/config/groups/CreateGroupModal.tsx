import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useAppDispatch } from '../../../../hooks/stateHooks';
import { upsertGroup } from '../../../../redux/rootSlice';
import { createGroup } from '../../../../utilities/api/groups';
import { Group } from '../../../../utilities/api/types';
import { sectionLabel, inputClass, primaryBtn, ghostBtn } from '../cloud/styles';
import { apiErrToast } from '../cloud/helpers';
import NestedSheet from '../cloud/NestedSheet';

const CreateGroupModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onCreated: (g: Group) => void;
}> = ({ isOpen, onClose, onCreated }) => {
    const dispatch = useAppDispatch();
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!isOpen) {
            setName('');
            setDescription('');
            setImageUrl('');
            setSaving(false);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = name.trim();
        if (!trimmed) {
            toast.error('Name is required.');
            return;
        }
        setSaving(true);
        try {
            const g = await createGroup({
                name: trimmed,
                description: description.trim() || undefined,
                image_url: imageUrl.trim() || undefined,
            });
            dispatch(upsertGroup(g));
            toast.success('Group created.');
            onCreated(g);
        } catch (e) {
            apiErrToast(e, 'Failed to create group.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <NestedSheet onClose={onClose} title="New group">
            <form onSubmit={submit} className="space-y-3">
                <label className="block">
                    <span className={`${sectionLabel} block mb-1`}>Name</span>
                    <input
                        className={inputClass}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        maxLength={100}
                        autoFocus
                        required
                    />
                </label>
                <label className="block">
                    <span className={`${sectionLabel} block mb-1`}>Description (optional)</span>
                    <textarea
                        className={`${inputClass} min-h-[60px]`}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        maxLength={500}
                    />
                </label>
                <label className="block">
                    <span className={`${sectionLabel} block mb-1`}>Image URL (optional)</span>
                    <input
                        className={inputClass}
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        maxLength={500}
                        placeholder="https://…"
                        type="url"
                    />
                </label>
                <div className="flex justify-end gap-2 pt-1">
                    <button type="button" onClick={onClose} className={ghostBtn}>Cancel</button>
                    <button type="submit" disabled={saving} className={primaryBtn}>
                        {saving ? 'Creating…' : 'Create'}
                    </button>
                </div>
            </form>
        </NestedSheet>
    );
};

export default CreateGroupModal;
