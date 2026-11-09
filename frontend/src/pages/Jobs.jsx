import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  getJobs,
  createJob,
  applyForJob,
  getMyApplications,
  toggleSaveJob,
  getSavedJobs,
  getExternalJobs
} from '../api/jobs';
import {
  Briefcase,
  Search,
  MapPin,
  Building,
  DollarSign,
  Clock,
  Bookmark,
  PlusCircle,
  CheckCircle2,
  Send,
  Sparkles,
  ExternalLink,
  Globe,
  Loader2,
  X
} from 'lucide-react';

export default function Jobs() {
  const { user } = useAuth();

  // Active tab: 'EXTERNAL' (default live Adzuna jobs), 'INTERNAL' (NodeWork jobs), 'APPLICATIONS', 'SAVED'
  const [activeTab, setActiveTab] = useState('EXTERNAL');

  // External (Adzuna) Jobs State
  const [externalJobs, setExternalJobs] = useState([]);
  const [selectedExternalJob, setSelectedExternalJob] = useState(null);
  const [externalSearchQuery, setExternalSearchQuery] = useState('developer');
  const [externalCountry, setExternalCountry] = useState('us');
  const [loadingExternal, setLoadingExternal] = useState(true);
  const [externalConfigured, setExternalConfigured] = useState(true);
  const [externalMsg, setExternalMsg] = useState('');

  // Internal NodeWork Jobs State
  const [internalJobs, setInternalJobs] = useState([]);
  const [selectedInternalJob, setSelectedInternalJob] = useState(null);
  const [internalSearchQuery, setInternalSearchQuery] = useState('');
  const [loadingInternal, setLoadingInternal] = useState(false);

  // Applications & Saved state
  const [myApplications, setMyApplications] = useState([]);
  const [savedJobs, setSavedJobs] = useState([]);

  // Modals
  const [showPostModal, setShowPostModal] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [submittingPost, setSubmittingPost] = useState(false);

  // Form states
  const [newJob, setNewJob] = useState({
    title: '',
    company: '',
    companyLogo: '',
    location: 'Remote',
    jobType: 'Full-time',
    experienceLevel: 'Mid-Senior level',
    salaryRange: '$120,000 - $160,000',
    description: '',
    requirements: ''
  });

  const [applyForm, setApplyForm] = useState({
    applicantName: user?.name || '',
    applicantEmail: user?.email || '',
    resumeUrl: '',
    coverNote: ''
  });

  // Load external jobs from Adzuna
  const loadExternal = async (query = externalSearchQuery, country = externalCountry) => {
    setLoadingExternal(true);
    try {
      const data = await getExternalJobs(query || 'developer', country, 1);
      if (data && data.configured === false) {
        setExternalConfigured(false);
        setExternalMsg(data.message || 'Adzuna credentials not configured.');
        setExternalJobs([]);
      } else {
        setExternalConfigured(true);
        const list = data?.jobs || [];
        setExternalJobs(list);
        if (list.length > 0) {
          setSelectedExternalJob(list[0]);
        } else {
          setSelectedExternalJob(null);
        }
      }
    } catch (err) {
      console.error('Failed to load external jobs:', err);
      setExternalJobs([]);
      setSelectedExternalJob(null);
    } finally {
      setLoadingExternal(false);
    }
  };

  // Load internal NodeWork jobs
  const loadInternal = async () => {
    setLoadingInternal(true);
    try {
      const data = await getJobs(internalSearchQuery, user?.id);
      const list = data || [];
      setInternalJobs(list);
      if (list.length > 0 && !selectedInternalJob) {
        setSelectedInternalJob(list[0].job);
      }
    } catch (err) {
      console.error('Failed to load internal jobs:', err);
    } finally {
      setLoadingInternal(false);
    }
  };

  const loadApplications = async () => {
    if (!user?.id) return;
    try {
      const apps = await getMyApplications(user.id);
      setMyApplications(apps || []);
    } catch (err) {
      console.error(err);
    }
  };

  const loadSaved = async () => {
    if (!user?.id) return;
    try {
      const saved = await getSavedJobs(user.id);
      setSavedJobs(saved || []);
    } catch (err) {
      console.error(err);
    }
  };

  // Initial load
  useEffect(() => {
    loadExternal();
    loadInternal();
  }, []);

  useEffect(() => {
    if (activeTab === 'APPLICATIONS') loadApplications();
    if (activeTab === 'SAVED') loadSaved();
    if (activeTab === 'INTERNAL') loadInternal();
  }, [activeTab, user?.id]);

  const handleExternalSearchSubmit = (e) => {
    e.preventDefault();
    loadExternal(externalSearchQuery, externalCountry);
  };

  const handlePostJob = async (e) => {
    e.preventDefault();
    if (!newJob.title || !newJob.company || !newJob.description) {
      alert('Please fill out the job title, company, and description.');
      return;
    }
    setSubmittingPost(true);
    try {
      await createJob({
        ...newJob,
        posterId: String(user?.id || '1'),
        posterName: user?.name || 'Recruiter'
      });
      setShowPostModal(false);
      setNewJob({
        title: '',
        company: '',
        companyLogo: '',
        location: 'Remote',
        jobType: 'Full-time',
        experienceLevel: 'Mid-Senior level',
        salaryRange: '$120,000 - $160,000',
        description: '',
        requirements: ''
      });
      setActiveTab('INTERNAL');
      await loadInternal();
      alert('Job posted successfully to NodeWork!');
    } catch (err) {
      alert(err.friendlyMessage || err.response?.data?.error || 'Failed to post job. Please try again.');
    } finally {
      setSubmittingPost(false);
    }
  };

  const handleApply = async (e) => {
    e.preventDefault();
    if (!selectedInternalJob) return;
    try {
      await applyForJob(selectedInternalJob.id, {
        applicantId: user.id,
        applicantName: applyForm.applicantName,
        applicantEmail: applyForm.applicantEmail,
        resumeUrl: applyForm.resumeUrl,
        coverNote: applyForm.coverNote
      });
      setShowApplyModal(false);
      alert('Application submitted successfully!');
      await loadInternal();
    } catch (err) {
      alert('Failed to submit application');
    }
  };

  const handleToggleSave = async (jobId) => {
    try {
      const res = await toggleSaveJob(jobId, user.id);
      setInternalJobs(prev =>
        prev.map(item =>
          item.job.id === jobId ? { ...item, savedByMe: res.saved } : item
        )
      );
      if (activeTab === 'SAVED') loadSaved();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="jobs-page-container">
      {/* Header Banner */}
      <div className="card jobs-header-card" style={{ marginBottom: '16px' }}>
        <div className="jobs-header-title">
          <h2>Find your next opportunity</h2>
          <p>Search thousands of live opportunities worldwide, or explore NodeWork community postings.</p>
        </div>

        {activeTab === 'EXTERNAL' ? (
          <form onSubmit={handleExternalSearchSubmit} className="jobs-search-bar" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <div className="search-input-group" style={{ flex: '1 1 240px' }}>
              <Search size={18} className="text-muted" />
              <input
                type="text"
                placeholder="Search live jobs by title, keyword, or skill (e.g. React, Engineer)..."
                value={externalSearchQuery}
                onChange={e => setExternalSearchQuery(e.target.value)}
              />
            </div>

            <select
              value={externalCountry}
              onChange={e => {
                setExternalCountry(e.target.value);
                loadExternal(externalSearchQuery, e.target.value);
              }}
              style={{
                padding: '8px 12px',
                borderRadius: '24px',
                border: '1px solid #cbd5e1',
                fontSize: '14px',
                background: '#fff',
                cursor: 'pointer'
              }}
            >
              <option value="us">🇺🇸 United States</option>
              <option value="gb">🇬🇧 United Kingdom</option>
              <option value="in">🇮🇳 India</option>
              <option value="ca">🇨🇦 Canada</option>
              <option value="au">🇦🇺 Australia</option>
              <option value="de">🇩🇪 Germany</option>
            </select>

            <button type="submit" className="btn btn-primary" disabled={loadingExternal}>
              {loadingExternal ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
              <span>Search Live</span>
            </button>
          </form>
        ) : (
          <div className="jobs-search-bar" style={{ display: 'flex', gap: '8px' }}>
            <div className="search-input-group" style={{ flex: 1 }}>
              <Search size={18} className="text-muted" />
              <input
                type="text"
                placeholder="Search NodeWork community jobs..."
                value={internalSearchQuery}
                onChange={e => {
                  setInternalSearchQuery(e.target.value);
                  loadInternal();
                }}
              />
            </div>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setShowPostModal(true)}
            >
              <PlusCircle size={16} />
              <span>Post a Job</span>
            </button>
          </div>
        )}
      </div>

      {/* Tabs Row */}
      <div className="jobs-tabs-row" style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <button
          type="button"
          className={`jobs-tab-btn ${activeTab === 'EXTERNAL' ? 'active' : ''}`}
          onClick={() => setActiveTab('EXTERNAL')}
        >
          <Globe size={16} />
          <span>Live Jobs (Adzuna API)</span>
        </button>

        <button
          type="button"
          className={`jobs-tab-btn ${activeTab === 'INTERNAL' ? 'active' : ''}`}
          onClick={() => setActiveTab('INTERNAL')}
        >
          <Briefcase size={16} />
          <span>NodeWork Postings ({internalJobs.length})</span>
        </button>

        <button
          type="button"
          className={`jobs-tab-btn ${activeTab === 'APPLICATIONS' ? 'active' : ''}`}
          onClick={() => setActiveTab('APPLICATIONS')}
        >
          <CheckCircle2 size={16} />
          <span>My Applications ({myApplications.length})</span>
        </button>

        <button
          type="button"
          className={`jobs-tab-btn ${activeTab === 'SAVED' ? 'active' : ''}`}
          onClick={() => setActiveTab('SAVED')}
        >
          <Bookmark size={16} />
          <span>Saved Jobs</span>
        </button>
      </div>

      {/* ──────────────── TAB 1: EXTERNAL JOBS (ADZUNA) ──────────────── */}
      {activeTab === 'EXTERNAL' && (
        <div className="jobs-split-view">
          {/* Left: Job listings */}
          <div className="jobs-list-pane">
            {loadingExternal ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                <Loader2 size={24} className="animate-spin" style={{ margin: '0 auto 12px' }} />
                <p>Loading live jobs from Adzuna...</p>
              </div>
            ) : !externalConfigured ? (
              <div className="card empty-sub-state" style={{ padding: '24px', textAlign: 'center' }}>
                <h4>Live Job Search</h4>
                <p style={{ color: '#64748b', margin: '8px 0 16px' }}>{externalMsg}</p>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setActiveTab('INTERNAL')}
                >
                  View NodeWork Community Jobs
                </button>
              </div>
            ) : externalJobs.length === 0 ? (
              <div className="card empty-sub-state" style={{ padding: '24px', textAlign: 'center' }}>
                <p>No live jobs matched "{externalSearchQuery}". Try another keyword or country.</p>
              </div>
            ) : (
              externalJobs.map(j => {
                const isSelected = selectedExternalJob?.id === j.id;
                return (
                  <div
                    key={j.id}
                    className={`card job-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => setSelectedExternalJob(j)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="job-card-header">
                      <div className="company-logo-placeholder">
                        <span>{j.company ? j.company.slice(0, 2).toUpperCase() : 'JO'}</span>
                      </div>
                      <div className="job-card-titles">
                        <h4 className="job-title">{j.title}</h4>
                        <div className="job-company">{j.company}</div>
                        <div className="job-meta-row">
                          <span>{j.location}</span>
                          <span>•</span>
                          <span style={{ color: '#0a66c2', fontWeight: 500 }}>Live Adzuna</span>
                        </div>
                      </div>
                    </div>

                    <div className="job-card-footer" style={{ marginTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className="salary-pill">{j.salary || 'Competitive'}</span>
                      <span style={{ fontSize: '11px', color: '#64748b' }}>
                        {j.createdAt ? new Date(j.createdAt).toLocaleDateString() : 'Recent'}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Right: Job Details Inspector */}
          <div className="jobs-details-pane">
            {selectedExternalJob ? (
              <div className="card job-details-card">
                <div className="job-details-header">
                  <div className="details-header-info">
                    <h2>{selectedExternalJob.title}</h2>
                    <div className="details-company-name">
                      {selectedExternalJob.company} • {selectedExternalJob.location}
                    </div>
                    <div className="details-tags-row" style={{ marginTop: '8px' }}>
                      <span className="detail-tag">
                        <DollarSign size={14} />
                        <span>{selectedExternalJob.salary || 'Competitive Salary'}</span>
                      </span>
                      <span className="detail-tag">
                        <Globe size={14} />
                        <span>Verified Live Listing</span>
                      </span>
                    </div>
                  </div>

                  <div className="details-actions-bar" style={{ marginTop: '16px' }}>
                    <a
                      href={selectedExternalJob.redirectUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-primary"
                      style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                    >
                      <ExternalLink size={16} />
                      <span>Apply on Employer / Adzuna Site</span>
                    </a>
                  </div>
                </div>

                <div className="details-divider" />

                <div className="details-section">
                  <h3>About this role</h3>
                  <p className="job-desc-text" style={{ whiteSpace: 'pre-line', lineHeight: '1.6' }}>
                    {selectedExternalJob.description}
                  </p>
                </div>
              </div>
            ) : (
              <div className="card empty-sub-state">Select a job on the left to inspect full details</div>
            )}
          </div>
        </div>
      )}

      {/* ──────────────── TAB 2: INTERNAL JOBS ──────────────── */}
      {activeTab === 'INTERNAL' && (
        <div className="jobs-split-view">
          <div className="jobs-list-pane">
            {loadingInternal ? (
              <div className="skeleton-card" style={{ height: 160 }} />
            ) : internalJobs.length === 0 ? (
              <div className="card empty-sub-state">
                <p>No community jobs posted yet.</p>
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ marginTop: '12px' }}
                  onClick={() => setShowPostModal(true)}
                >
                  <PlusCircle size={16} /> Post First Opening
                </button>
              </div>
            ) : (
              internalJobs.map(item => {
                const j = item.job;
                const isSelected = selectedInternalJob?.id === j.id;

                return (
                  <div
                    key={j.id}
                    className={`card job-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => setSelectedInternalJob(j)}
                  >
                    <div className="job-card-header">
                      <div className="company-logo-placeholder">
                        {j.companyLogo ? (
                          <img src={j.companyLogo} alt={j.company} />
                        ) : (
                          <span>{j.company.slice(0, 2).toUpperCase()}</span>
                        )}
                      </div>
                      <div className="job-card-titles">
                        <h4 className="job-title">{j.title}</h4>
                        <div className="job-company">{j.company}</div>
                        <div className="job-meta-row">
                          <span>{j.location}</span>
                          <span>•</span>
                          <span>{j.jobType}</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        className={`btn-icon ${item.savedByMe ? 'text-accent' : 'text-muted'}`}
                        title="Save Job"
                        onClick={e => {
                          e.stopPropagation();
                          handleToggleSave(j.id);
                        }}
                      >
                        <Bookmark size={18} fill={item.savedByMe ? 'currentColor' : 'none'} />
                      </button>
                    </div>

                    <div className="job-card-footer">
                      <span className="salary-pill">{j.salaryRange}</span>
                      {item.appliedByMe && (
                        <span className="badge-applied">✓ Applied</span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="jobs-details-pane">
            {selectedInternalJob ? (
              <div className="card job-details-card">
                <div className="job-details-header">
                  <div className="details-header-info">
                    <h2>{selectedInternalJob.title}</h2>
                    <div className="details-company-name">
                      {selectedInternalJob.company} • {selectedInternalJob.location} ({selectedInternalJob.jobType})
                    </div>
                    <div className="details-tags-row">
                      <span className="detail-tag">
                        <Building size={14} />
                        <span>{selectedInternalJob.experienceLevel}</span>
                      </span>
                      <span className="detail-tag">
                        <DollarSign size={14} />
                        <span>{selectedInternalJob.salaryRange}</span>
                      </span>
                      <span className="detail-tag">
                        <Clock size={14} />
                        <span>{selectedInternalJob.applicantCount || 0} applicants</span>
                      </span>
                    </div>
                  </div>

                  <div className="details-actions-bar">
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => setShowApplyModal(true)}
                    >
                      <Send size={16} />
                      <span>Easy Apply</span>
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline"
                      onClick={() => handleToggleSave(selectedInternalJob.id)}
                    >
                      <Bookmark size={16} />
                      <span>Save Job</span>
                    </button>
                  </div>
                </div>

                <div className="details-divider" />

                <div className="details-section">
                  <h3>About the job</h3>
                  <p className="job-desc-text">{selectedInternalJob.description}</p>
                </div>

                {selectedInternalJob.requirements && (
                  <div className="details-section">
                    <h3>Key Requirements</h3>
                    <p className="job-desc-text">{selectedInternalJob.requirements}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="card empty-sub-state">Select a job on the left to view details</div>
            )}
          </div>
        </div>
      )}

      {/* ──────────────── TAB 3: MY APPLICATIONS ──────────────── */}
      {activeTab === 'APPLICATIONS' && (
        <div className="card section-card">
          <div className="section-header">
            <h3>Submitted Applications</h3>
          </div>
          {myApplications.length === 0 ? (
            <div className="empty-sub-state">
              You haven't applied to any roles yet. Explore live jobs above!
            </div>
          ) : (
            <div className="applications-table-wrap">
              <table className="applications-table">
                <thead>
                  <tr>
                    <th>Role & Company</th>
                    <th>Date Applied</th>
                    <th>Resume</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {myApplications.map(app => (
                    <tr key={app.id}>
                      <td>
                        <strong>{app.jobTitle}</strong>
                        <div className="text-muted">{app.company}</div>
                      </td>
                      <td>{new Date(app.appliedAt).toLocaleDateString()}</td>
                      <td>
                        {app.resumeUrl ? (
                          <a href={app.resumeUrl} target="_blank" rel="noreferrer" className="text-accent">
                            View Resume
                          </a>
                        ) : (
                          'Profile attached'
                        )}
                      </td>
                      <td>
                        <span className={`status-pill status-${app.status?.toLowerCase() || 'applied'}`}>
                          {app.status || 'Applied'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ──────────────── TAB 4: SAVED JOBS ──────────────── */}
      {activeTab === 'SAVED' && (
        <div className="card section-card">
          <div className="section-header">
            <h3>Saved Jobs ({savedJobs.length})</h3>
          </div>
          {savedJobs.length === 0 ? (
            <div className="empty-sub-state">No saved jobs. Bookmark roles in Explore!</div>
          ) : (
            <div className="saved-jobs-grid">
              {savedJobs.map(job => (
                <div key={job.id} className="card job-card">
                  <div className="job-card-header">
                    <div className="company-logo-placeholder">
                      <span>{job.company.slice(0, 2).toUpperCase()}</span>
                    </div>
                    <div className="job-card-titles">
                      <h4>{job.title}</h4>
                      <div>{job.company} • {job.location}</div>
                    </div>
                  </div>
                  <div className="job-card-footer">
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={() => {
                        setSelectedInternalJob(job);
                        setActiveTab('INTERNAL');
                      }}
                    >
                      View Posting
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal: Post a Job */}
      {showPostModal && (
        <div className="modal-backdrop" onClick={() => setShowPostModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Post a New Opening on NodeWork</h3>
              <button
                type="button"
                className="btn-icon"
                onClick={() => setShowPostModal(false)}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handlePostJob} className="post-job-form">
              <div className="form-group">
                <label>Job Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Senior Backend Engineer"
                  value={newJob.title}
                  onChange={e => setNewJob({ ...newJob, title: e.target.value })}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Company *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. TechCorp Systems"
                    value={newJob.company}
                    onChange={e => setNewJob({ ...newJob, company: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Location</label>
                  <input
                    type="text"
                    placeholder="e.g. San Francisco, CA or Remote"
                    value={newJob.location}
                    onChange={e => setNewJob({ ...newJob, location: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Job Type</label>
                  <select
                    value={newJob.jobType}
                    onChange={e => setNewJob({ ...newJob, jobType: e.target.value })}
                  >
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Contract">Contract</option>
                    <option value="Internship">Internship</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Salary Range</label>
                  <input
                    type="text"
                    placeholder="e.g. $130,000 - $170,000"
                    value={newJob.salaryRange}
                    onChange={e => setNewJob({ ...newJob, salaryRange: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Job Description *</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Detail the responsibilities, team impact, and day-to-day workflow..."
                  value={newJob.description}
                  onChange={e => setNewJob({ ...newJob, description: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Key Requirements</label>
                <textarea
                  rows={3}
                  placeholder="Years of experience, technical stack, qualifications..."
                  value={newJob.requirements}
                  onChange={e => setNewJob({ ...newJob, requirements: e.target.value })}
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setShowPostModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submittingPost}>
                  {submittingPost ? 'Publishing...' : 'Publish Job Posting'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Easy Apply */}
      {showApplyModal && selectedInternalJob && (
        <div className="modal-backdrop" onClick={() => setShowApplyModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Apply to {selectedInternalJob.title}</h3>
              <button
                type="button"
                className="btn-icon"
                onClick={() => setShowApplyModal(false)}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleApply} className="apply-job-form">
              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  required
                  value={applyForm.applicantName}
                  onChange={e => setApplyForm({ ...applyForm, applicantName: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  required
                  value={applyForm.applicantEmail}
                  onChange={e => setApplyForm({ ...applyForm, applicantEmail: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Resume / Portfolio Link</label>
                <input
                  type="url"
                  placeholder="https://drive.google.com/your-resume or portfolio URL"
                  value={applyForm.resumeUrl}
                  onChange={e => setApplyForm({ ...applyForm, resumeUrl: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Cover Note (Optional)</label>
                <textarea
                  rows={3}
                  placeholder="Briefly describe why you are interested in this position..."
                  value={applyForm.coverNote}
                  onChange={e => setApplyForm({ ...applyForm, coverNote: e.target.value })}
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setShowApplyModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Submit Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
