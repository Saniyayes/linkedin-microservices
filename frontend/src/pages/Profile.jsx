import { useState, useEffect, useRef } from 'react';
import { uploadToCloudinary } from '../utils/cloudinary';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  getUserProfile,
  updateProfile,
  addExperience,
  deleteExperience,
  addEducation,
  deleteEducation,
  addCertification,
  deleteCertification
} from '../api/users';
import {
  getConnectionStatus,
  sendConnectionRequest,
  acceptConnectionRequest
} from '../api/connections';
import { getPostsByAuthor } from '../api/posts';
import {
  Edit3,
  Plus,
  Trash2,
  MapPin,
  Phone,
  Building,
  GraduationCap,
  Globe,
  Award,
  Briefcase,
  Camera,
  Check,
  UserPlus,
  MessageSquare,
  Sparkles,
  ExternalLink,
  X
} from 'lucide-react';

export default function Profile() {
  const { id } = useParams();
  const { user: currentUser, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const profileId = id || currentUser?.id;
  const isMine = String(profileId) === String(currentUser?.id);

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [connStatus, setConnStatus] = useState('NONE');
  const [posts, setPosts] = useState([]);

  // Modals
  const [showEditModal, setShowEditModal] = useState(false);
  const [showExpModal, setShowExpModal] = useState(false);
  const [showEduModal, setShowEduModal] = useState(false);
  const [showCertModal, setShowCertModal] = useState(false);
  const [showSkillModal, setShowSkillModal] = useState(false);

  // Form states
  const [editForm, setEditForm] = useState({});
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const avatarFileRef = useRef(null);
  const coverFileRef = useRef(null);

  const handleAvatarUpload = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setUploadingAvatar(true);
    try {
      const url = await uploadToCloudinary(f);
      setEditForm(prev => ({ ...prev, avatarUrl: url }));
    } catch (err) {
      alert(err.message || 'Avatar upload failed');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleCoverUpload = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setUploadingCover(true);
    try {
      const url = await uploadToCloudinary(f);
      setEditForm(prev => ({ ...prev, coverUrl: url }));
    } catch (err) {
      alert(err.message || 'Cover photo upload failed');
    } finally {
      setUploadingCover(false);
    }
  };
  const [expForm, setExpForm] = useState({ title: '', company: '', location: '', startDate: '', endDate: '', isCurrent: false, description: '' });
  const [eduForm, setEduForm] = useState({ school: '', degree: '', fieldOfStudy: '', startYear: '', endYear: '', grade: '' });
  const [certForm, setCertForm] = useState({ name: '', issuingOrganization: '', issueDate: '', credentialUrl: '' });
  const [newSkill, setNewSkill] = useState('');

  const loadProfile = async () => {
    if (!profileId) return;
    try {
      const data = await getUserProfile(profileId);
      setProfile(data);
      setEditForm({
        name: data.name || '',
        title: data.title || '',
        headline: data.headline || '',
        company: data.company || '',
        college: data.college || '',
        location: data.location || '',
        about: data.about || '',
        website: data.website || '',
        phone: data.phone || '',
        avatarUrl: data.avatarUrl || '',
        coverUrl: data.coverUrl || ''
      });

      if (!isMine && currentUser?.id) {
        const statusRes = await getConnectionStatus(currentUser.id, profileId);
        setConnStatus(statusRes.status || 'NONE');
      }

      // Load user posts
      const postsRes = await getPostsByAuthor(profileId, currentUser?.id);
      setPosts(postsRes || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [profileId, isMine, currentUser?.id]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      await updateProfile(profileId, editForm);
      setShowEditModal(false);
      await loadProfile();
      if (isMine) refreshProfile();
    } catch (err) {
      alert('Could not update profile');
    }
  };

  const handleAddExp = async (e) => {
    e.preventDefault();
    try {
      await addExperience(profileId, expForm);
      setShowExpModal(false);
      setExpForm({ title: '', company: '', location: '', startDate: '', endDate: '', isCurrent: false, description: '' });
      await loadProfile();
    } catch (err) {
      alert('Failed to add experience');
    }
  };

  const handleDeleteExp = async (expId) => {
    if (!window.confirm('Delete this experience?')) return;
    try {
      await deleteExperience(profileId, expId);
      await loadProfile();
    } catch (err) {
      alert('Failed to delete experience');
    }
  };

  const handleAddEdu = async (e) => {
    e.preventDefault();
    try {
      await addEducation(profileId, eduForm);
      setShowEduModal(false);
      setEduForm({ school: '', degree: '', fieldOfStudy: '', startYear: '', endYear: '', grade: '' });
      await loadProfile();
    } catch (err) {
      alert('Failed to add education');
    }
  };

  const handleDeleteEdu = async (eduId) => {
    if (!window.confirm('Delete this education?')) return;
    try {
      await deleteEducation(profileId, eduId);
      await loadProfile();
    } catch (err) {
      alert('Failed to delete education');
    }
  };

  const handleAddCert = async (e) => {
    e.preventDefault();
    try {
      await addCertification(profileId, certForm);
      setShowCertModal(false);
      setCertForm({ name: '', issuingOrganization: '', issueDate: '', credentialUrl: '' });
      await loadProfile();
    } catch (err) {
      alert('Failed to add certification');
    }
  };

  const handleDeleteCert = async (certId) => {
    if (!window.confirm('Delete this certification?')) return;
    try {
      await deleteCertification(profileId, certId);
      await loadProfile();
    } catch (err) {
      alert('Failed to delete certification');
    }
  };

  const handleAddSkill = async (e) => {
    e.preventDefault();
    if (!newSkill.trim()) return;
    const currentSkills = profile?.skills || [];
    if (currentSkills.includes(newSkill.trim())) return;

    try {
      await updateProfile(profileId, { skills: [...currentSkills, newSkill.trim()] });
      setNewSkill('');
      setShowSkillModal(false);
      await loadProfile();
    } catch (err) {
      alert('Failed to add skill');
    }
  };

  const handleConnectAction = async () => {
    try {
      await sendConnectionRequest(currentUser.id, profileId, currentUser.name, profile.name);
      setConnStatus('PENDING_OUTGOING');
    } catch (err) {
      alert('Failed to send connection request');
    }
  };

  const handleAcceptAction = async () => {
    try {
      await acceptConnectionRequest(profileId, currentUser.id);
      setConnStatus('CONNECTED');
      await loadProfile();
    } catch (err) {
      alert('Failed to accept request');
    }
  };

  if (loading) {
    return (
      <div className="profile-container">
        <div className="skeleton-card" style={{ height: 320 }} />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="card profile-error-card">
        <h3>User not found</h3>
        <button type="button" className="btn btn-primary" onClick={() => navigate('/feed')}>
          Back to Feed
        </button>
      </div>
    );
  }

  const avatar = profile.avatarUrl;
  const initials = profile.name ? profile.name.slice(0, 2).toUpperCase() : 'M';
  const completion = profile.completionPercentage || 60;

  return (
    <div className="profile-container">
      {/* ──────────────── Main Profile Banner Card ──────────────── */}
      <div className="card profile-hero-card">
        <div
          className="profile-cover-banner"
          style={{
            backgroundImage: profile.coverUrl
              ? `url(${profile.coverUrl})`
              : 'linear-gradient(135deg, #0a66c2 0%, #004182 100%)'
          }}
        >
          {isMine && (
            <button
              type="button"
              className="btn-icon cover-camera-btn"
              title="Change cover photo"
              onClick={() => {
                const url = prompt('Enter Cover Image URL:', profile.coverUrl || '');
                if (url !== null) updateProfile(profileId, { coverUrl: url }).then(loadProfile);
              }}
            >
              <Camera size={18} />
            </button>
          )}
        </div>

        <div className="profile-hero-content">
          <div className="profile-avatar-row">
            <div className="profile-avatar-main">
              {avatar ? <img src={avatar} alt={profile.name} /> : <span>{initials}</span>}
              {isMine && (
                <button
                  type="button"
                  className="avatar-edit-overlay"
                  title="Change avatar URL"
                  onClick={() => {
                    const url = prompt('Enter Avatar Image URL:', profile.avatarUrl || '');
                    if (url !== null) updateProfile(profileId, { avatarUrl: url }).then(loadProfile);
                  }}
                >
                  <Camera size={16} />
                </button>
              )}
            </div>

            {isMine ? (
              <button
                type="button"
                className="btn-icon edit-profile-trigger"
                onClick={() => setShowEditModal(true)}
              >
                <Edit3 size={18} />
              </button>
            ) : (
              <div className="profile-connect-actions">
                {connStatus === 'CONNECTED' ? (
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => navigate(`/messaging?userId=${profile.id}`)}
                  >
                    <MessageSquare size={16} />
                    <span>Message</span>
                  </button>
                ) : connStatus === 'PENDING_INCOMING' ? (
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={handleAcceptAction}
                  >
                    <Check size={16} />
                    <span>Accept Request</span>
                  </button>
                ) : connStatus === 'PENDING_OUTGOING' ? (
                  <button type="button" className="btn btn-outline btn-sm" disabled>
                    <Check size={16} />
                    <span>Pending Request</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={handleConnectAction}
                  >
                    <UserPlus size={16} />
                    <span>Connect</span>
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="profile-details-block">
            <h1 className="profile-name">{profile.name}</h1>
            <p className="profile-headline">{profile.headline || profile.title || 'Professional Member'}</p>

            <div className="profile-meta-chips">
              {profile.company && (
                <span className="profile-chip">
                  <Building size={14} />
                  <span>{profile.company}</span>
                </span>
              )}
              {profile.college && (
                <span className="profile-chip">
                  <GraduationCap size={14} />
                  <span>{profile.college}</span>
                </span>
              )}
              {profile.location && (
                <span className="profile-chip">
                  <MapPin size={14} />
                  <span>{profile.location}</span>
                </span>
              )}
              {profile.phone && (
                <span className="profile-chip">
                  <Phone size={14} />
                  <span>{profile.phone}</span>
                </span>
              )}
              {profile.website && (
                <a
                  href={profile.website}
                  target="_blank"
                  rel="noreferrer"
                  className="profile-chip link-chip"
                >
                  <Globe size={14} />
                  <span>Portfolio / Website</span>
                  <ExternalLink size={12} />
                </a>
              )}
            </div>

            <div className="profile-connections-summary">
              <span
                className="clickable font-semibold text-accent"
                onClick={() => navigate('/connections')}
              >
                {profile.connectionsCount || 0} connections
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ──────────────── Profile Completion Meter (if mine) ──────────────── */}
      {isMine && (
        <div className="card profile-meter-card">
          <div className="meter-header">
            <div className="meter-title">
              <Sparkles size={18} className="text-accent" />
              <h4>Profile Strength: {completion === 100 ? 'All-Star 🌟' : 'Intermediate'}</h4>
            </div>
            <span className="meter-percent">{completion}%</span>
          </div>
          <div className="meter-bar-bg">
            <div className="meter-bar-fill" style={{ width: `${completion}%` }} />
          </div>
          <p className="meter-hint">
            {completion === 100
              ? 'Great job! Your profile has reached 100% completion.'
              : 'Add your summary, work experience, education, and skills to stand out to recruiters.'}
          </p>
        </div>
      )}

      {/* ──────────────── About / Summary Card ──────────────── */}
      <div className="card section-card">
        <div className="section-card-header">
          <h3>About</h3>
          {isMine && (
            <button
              type="button"
              className="btn-icon"
              onClick={() => setShowEditModal(true)}
            >
              <Edit3 size={16} />
            </button>
          )}
        </div>
        <p className="about-text">
          {profile.about ||
            (isMine
              ? 'Write a summary to highlight your personality, work ethic, and achievements.'
              : 'No summary provided.')}
        </p>
      </div>

      {/* ──────────────── Experience Section ──────────────── */}
      <div className="card section-card">
        <div className="section-card-header">
          <h3>Experience</h3>
          {isMine && (
            <button
              type="button"
              className="btn-icon"
              onClick={() => setShowExpModal(true)}
            >
              <Plus size={18} />
            </button>
          )}
        </div>

        {(!profile.experiences || profile.experiences.length === 0) ? (
          <div className="empty-sub-state">
            {isMine
              ? 'Showcase your career highlights, internships, or freelance work.'
              : 'No experience listed yet.'}
          </div>
        ) : (
          <div className="timeline-list">
            {profile.experiences.map(exp => (
              <div key={exp.id} className="timeline-item">
                <div className="timeline-icon">
                  <Briefcase size={20} />
                </div>
                <div className="timeline-content">
                  <div className="timeline-title-row">
                    <h4>{exp.title}</h4>
                    {isMine && (
                      <button
                        type="button"
                        className="btn-icon text-muted"
                        onClick={() => handleDeleteExp(exp.id)}
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                  <div className="timeline-company">{exp.company}</div>
                  <div className="timeline-dates">
                    {exp.startDate} - {exp.isCurrent ? 'Present' : exp.endDate || 'Present'} •{' '}
                    {exp.location || 'Remote'}
                  </div>
                  {exp.description && <p className="timeline-desc">{exp.description}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ──────────────── Education Section ──────────────── */}
      <div className="card section-card">
        <div className="section-card-header">
          <h3>Education</h3>
          {isMine && (
            <button
              type="button"
              className="btn-icon"
              onClick={() => setShowEduModal(true)}
            >
              <Plus size={18} />
            </button>
          )}
        </div>

        {(!profile.educations || profile.educations.length === 0) ? (
          <div className="empty-sub-state">
            {isMine ? 'Add your university, college, or degree program.' : 'No education listed.'}
          </div>
        ) : (
          <div className="timeline-list">
            {profile.educations.map(edu => (
              <div key={edu.id} className="timeline-item">
                <div className="timeline-icon">
                  <GraduationCap size={20} />
                </div>
                <div className="timeline-content">
                  <div className="timeline-title-row">
                    <h4>{edu.school}</h4>
                    {isMine && (
                      <button
                        type="button"
                        className="btn-icon text-muted"
                        onClick={() => handleDeleteEdu(edu.id)}
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                  <div className="timeline-company">
                    {edu.degree} {edu.fieldOfStudy ? `in ${edu.fieldOfStudy}` : ''}
                  </div>
                  <div className="timeline-dates">
                    {edu.startYear} - {edu.endYear || 'Present'} {edu.grade ? `• Grade: ${edu.grade}` : ''}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ──────────────── Skills & Expertise ──────────────── */}
      <div className="card section-card">
        <div className="section-card-header">
          <h3>Skills & Endorsements</h3>
          {isMine && (
            <button
              type="button"
              className="btn-icon"
              onClick={() => setShowSkillModal(true)}
            >
              <Plus size={18} />
            </button>
          )}
        </div>

        {(!profile.skills || profile.skills.length === 0) ? (
          <div className="empty-sub-state">
            {isMine ? 'Add top skills so network connections can endorse you.' : 'No skills listed.'}
          </div>
        ) : (
          <div className="skills-cloud">
            {profile.skills.map((s, idx) => (
              <span key={idx} className="skill-chip">
                <span>{s}</span>
                <span className="endorse-badge">★</span>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ──────────────── Certifications & Licenses ──────────────── */}
      <div className="card section-card">
        <div className="section-card-header">
          <h3>Licenses & Certifications</h3>
          {isMine && (
            <button
              type="button"
              className="btn-icon"
              onClick={() => setShowCertModal(true)}
            >
              <Plus size={18} />
            </button>
          )}
        </div>

        {(!profile.certifications || profile.certifications.length === 0) ? (
          <div className="empty-sub-state">
            {isMine ? 'Add certifications from AWS, Google Cloud, Coursera, etc.' : 'No certifications listed.'}
          </div>
        ) : (
          <div className="timeline-list">
            {profile.certifications.map(cert => (
              <div key={cert.id} className="timeline-item">
                <div className="timeline-icon">
                  <Award size={20} />
                </div>
                <div className="timeline-content">
                  <div className="timeline-title-row">
                    <h4>{cert.name}</h4>
                    {isMine && (
                      <button
                        type="button"
                        className="btn-icon text-muted"
                        onClick={() => handleDeleteCert(cert.id)}
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                  <div className="timeline-company">{cert.issuingOrganization}</div>
                  <div className="timeline-dates">Issued {cert.issueDate || 'Recently'}</div>
                  {cert.credentialUrl && (
                    <a
                      href={cert.credentialUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="cert-link"
                    >
                      Show credential <ExternalLink size={12} />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ──────────────── Recent Activity / Posts ──────────────── */}
      <div className="card section-card">
        <div className="section-card-header">
          <h3>Activity</h3>
        </div>
        {posts.length === 0 ? (
          <div className="empty-sub-state">No recent posts.</div>
        ) : (
          <div className="activity-posts-list">
            {posts.map(p => (
              <div key={p.id} className="activity-post-item">
                <p>{p.content}</p>
                <div className="activity-post-meta">
                  <span>👍 {p.likesCount || 0}</span>
                  <span>💬 {p.commentsCount || 0}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ──────────────── MODAL: EDIT PROFILE ──────────────── */}
      {showEditModal && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Edit Intro</h3>
              <button type="button" className="btn-icon" onClick={() => setShowEditModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSaveProfile}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Full Name</label>
                  <input
                    type="text"
                    required
                    value={editForm.name}
                    onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Headline</label>
                  <input
                    type="text"
                    placeholder="e.g. Senior Software Engineer @ TechCorp | Cloud & Distributed Systems"
                    value={editForm.headline}
                    onChange={e => setEditForm({ ...editForm, headline: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Current Company</label>
                  <input
                    type="text"
                    value={editForm.company}
                    onChange={e => setEditForm({ ...editForm, company: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Education / College</label>
                  <input
                    type="text"
                    value={editForm.college}
                    onChange={e => setEditForm({ ...editForm, college: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Location</label>
                  <input
                    type="text"
                    placeholder="e.g. San Francisco, California"
                    value={editForm.location}
                    onChange={e => setEditForm({ ...editForm, location: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Website or Portfolio Link</label>
                  <input
                    type="url"
                    placeholder="https://myportfolio.com"
                    value={editForm.website}
                    onChange={e => setEditForm({ ...editForm, website: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>About / Summary</label>
                  <textarea
                    rows={4}
                    placeholder="Summary of experience, technical background, and passion..."
                    value={editForm.about}
                    onChange={e => setEditForm({ ...editForm, about: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Avatar Image URL</label>
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/..."
                    value={editForm.avatarUrl}
                    onChange={e => setEditForm({ ...editForm, avatarUrl: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowEditModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ──────────────── MODAL: ADD EXPERIENCE ──────────────── */}
      {showExpModal && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Add Experience</h3>
              <button type="button" className="btn-icon" onClick={() => setShowExpModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddExp}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Staff Backend Engineer"
                    value={expForm.title}
                    onChange={e => setExpForm({ ...expForm, title: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Company *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Microsoft"
                    value={expForm.company}
                    onChange={e => setExpForm({ ...expForm, company: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Location</label>
                  <input
                    type="text"
                    placeholder="e.g. Seattle, WA (Hybrid)"
                    value={expForm.location}
                    onChange={e => setExpForm({ ...expForm, location: e.target.value })}
                  />
                </div>
                <div className="form-row-2">
                  <div className="form-group">
                    <label>Start Date</label>
                    <input
                      type="text"
                      placeholder="e.g. Jan 2021"
                      value={expForm.startDate}
                      onChange={e => setExpForm({ ...expForm, startDate: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>End Date</label>
                    <input
                      type="text"
                      placeholder="e.g. Present"
                      disabled={expForm.isCurrent}
                      value={expForm.isCurrent ? 'Present' : expForm.endDate}
                      onChange={e => setExpForm({ ...expForm, endDate: e.target.value })}
                    />
                  </div>
                </div>
                <div className="form-checkbox-row">
                  <input
                    type="checkbox"
                    id="currExp"
                    checked={expForm.isCurrent}
                    onChange={e => setExpForm({ ...expForm, isCurrent: e.target.checked })}
                  />
                  <label htmlFor="currExp">I am currently working in this role</label>
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    rows={3}
                    placeholder="Describe your responsibilities, technical impact, tools used..."
                    value={expForm.description}
                    onChange={e => setExpForm({ ...expForm, description: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowExpModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ──────────────── MODAL: ADD EDUCATION ──────────────── */}
      {showEduModal && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Add Education</h3>
              <button type="button" className="btn-icon" onClick={() => setShowEduModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddEdu}>
              <div className="modal-body">
                <div className="form-group">
                  <label>School or University *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. UC Berkeley"
                    value={eduForm.school}
                    onChange={e => setEduForm({ ...eduForm, school: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Degree</label>
                  <input
                    type="text"
                    placeholder="e.g. Bachelor of Science"
                    value={eduForm.degree}
                    onChange={e => setEduForm({ ...eduForm, degree: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Field of Study</label>
                  <input
                    type="text"
                    placeholder="e.g. Computer Science & Engineering"
                    value={eduForm.fieldOfStudy}
                    onChange={e => setEduForm({ ...eduForm, fieldOfStudy: e.target.value })}
                  />
                </div>
                <div className="form-row-2">
                  <div className="form-group">
                    <label>Start Year</label>
                    <input
                      type="text"
                      placeholder="e.g. 2018"
                      value={eduForm.startYear}
                      onChange={e => setEduForm({ ...eduForm, startYear: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>End Year</label>
                    <input
                      type="text"
                      placeholder="e.g. 2022"
                      value={eduForm.endYear}
                      onChange={e => setEduForm({ ...eduForm, endYear: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowEduModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ──────────────── MODAL: ADD SKILL ──────────────── */}
      {showSkillModal && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Add Skill</h3>
              <button type="button" className="btn-icon" onClick={() => setShowSkillModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddSkill}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Skill Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Spring Boot, Kafka, React, System Design"
                    value={newSkill}
                    onChange={e => setNewSkill(e.target.value)}
                    autoFocus
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowSkillModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={!newSkill.trim()}>
                  Add Skill
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ──────────────── MODAL: ADD CERTIFICATION ──────────────── */}
      {showCertModal && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Add License or Certification</h3>
              <button type="button" className="btn-icon" onClick={() => setShowCertModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddCert}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. AWS Certified Solutions Architect"
                    value={certForm.name}
                    onChange={e => setCertForm({ ...certForm, name: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Issuing Organization *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Amazon Web Services"
                    value={certForm.issuingOrganization}
                    onChange={e => setCertForm({ ...certForm, issuingOrganization: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Issue Date</label>
                  <input
                    type="text"
                    placeholder="e.g. March 2023"
                    value={certForm.issueDate}
                    onChange={e => setCertForm({ ...certForm, issueDate: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Credential URL</label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={certForm.credentialUrl}
                    onChange={e => setCertForm({ ...certForm, credentialUrl: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowCertModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
