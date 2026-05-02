# Skills UI


| Component              | Role                                                                                               |
| ---------------------- | -------------------------------------------------------------------------------------------------- |
| `skills-dashboard.tsx` | Lists skills with file counts, agent checkboxes (attach/detach), delete, modals for install flows. |
| `skills-dashboard-file-tree.tsx` | Skill detail sidebar file tree (`SkillFileTreeRow`), metadata strip (`MetaField`), file-type icons. |
| `upload-form.tsx`      | Client form → `installSkillFromFiles` (ZIP, multi-file, or folder picker).                         |
| `github-link-form.tsx` | Client form → `installSkillFromGitHub`.                                                            |


Used by `app/dashboard/skills/page.tsx`.