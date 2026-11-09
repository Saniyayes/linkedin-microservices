import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  getJobs,
  createJob,
  applyForJob,
  getMyApplications,
  toggleSaveJob,
  getSavedJobs
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
  X
} from 'lucide-react';

export default function Jobs() {
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState('EXPLORE'); // EXPLORE, APPLICATIONS, SAVED
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [myApplications, setMyApplications] = useState([]);
  const [savedJobs, setSavedJobs] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [externalJobs, setExternalJobs] = useState([]);
  const [loadingExternal, setLoadingExternal] = useState(false);
  const [externalConfigured, setExternalConfigured] = useState(true);
  const [externalMsg, setExternalMsg] = useState('');

  const loadExternal = async () => {
    setLoadingExternal(true);
    try {
      const data = await getExternalJobs(searchQuery || 'engineer');
      if (data.configured === false) {
        setExternalConfigured(false);
        setExternalMsg(data.message);
      } else {
        setExternalConfigured(true);
        setExternalJobs(data.jobs || []);
      }
    } catch (err) {
      setExternalJobs([]);
    } finally {
      setLoadingExternal(false);
    }
  };

  // Modals
  const [showPostModal, setShowPostModal] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);

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

  const loadJobs = async () => {
    try {
      const data = await getJobs(searchQuery, user?.id);
      setJobs(data || []);
      if (data && data.length > 0 && !selectedJob) {
        setSelectedJob(data[0].job);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
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

  useEffect(() => {
    loadJobs();
  }, [searchQuery, user?.id]);

  useEffect(() => {
    if (activeTab === 'APPLICATIONS') loadApplications();
    if (activeTab === 'SAVED') loadSaved();
  }, [activeTab, user?.id]);

  const handlePostJob = async (e) => {
    e.preventDefault();
    try {
      await createJob({
        ...newJob,
        posterId: user.id,
        posterName: user.name
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
      await loadJobs();
    } catch (err) {
      alert('Failed to post job');
    }
  };

  const handleApply = async (e) => {
    e.preventDefault();
    if (!selectedJob) return;
    try {
      await applyForJob(selectedJob.id, {
        applicantId: user.id,
        applicantName: applyForm.applicantName,
        applicantEmail: applyForm.applicantEmail,
        resumeUrl: applyForm.resumeUrl,
        coverNote: applyForm.coverNote
      });
      setShowApplyModal(false);
      alert('Application submitted successfully!');
      await loadJobs();
    } catch (err) {
      alert('Failed to submit application');
    }
  };

  const handleToggleSave = async (jobId) => {
    try {
      const res = await toggleSaveJob(jobId, user.id);
      setJobs(prev =>
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
      {/* Search & Header banner */}
      <div className="card jobs-header-card">
        <div className="jobs-header-title">
          <h2>Find your next dream opportunity</h2>
          <p>Explore high-impact engineering, product, and leadership roles</p>
        </div>

        <div className="jobs-search-bar">
          <div className="search-input-group">
            <Search size={18} className="text-muted" />
            <input
              type="text"
              placeholder="Search by title, skill, or company..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
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
      </div>

      {/* Tabs */}
      <div className="jobs-tabs-row">
        <button
          type="button"
          className={`jobs-tab-btn ${activeTab === 'EXPLORE' ? 'active' : ''}`}
          onClick={() => setActiveTab('EXPLORE')}
        >
          <Briefcase size={16} />
          <span>Explore Roles</span>
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

      {/* ──────────────── TAB 1: EXPLORE JOBS (Split View) ──────────────── */}
      {activeTab === 'EXPLORE' && (
        <div className="jobs-split-view">
          {/* Left: Job listings */}
          <div className="jobs-list-pane">
            {loading ? (
              <div className="skeleton-card" style={{ height: 160 }} />
            ) : jobs.length === 0 ? (
              <div className="card empty-sub-state">
                No jobs matching your search. Be the first to post an opening!
              </div>
            ) : (
              jobs.map(item => {
                const j = item.job;
                const isSelected = selectedJob?.id === j.id;

                return (
                  <div
                    key={j.id}
                    className={`card job-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => setSelectedJob(j)}
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

          {/* Right: Job Details Inspector Pane */}
          <div className="jobs-details-pane">
            {selectedJob ? (
              <div className="card job-details-card">
                <div className="job-details-header">
                  <div className="details-header-info">
                    <h2>{selectedJob.title}</h2>
                    <div className="details-company-name">
                      {selectedJob.company} • {selectedJob.location} ({selectedJob.jobType})
                    </div>
                    <div className="details-tags-row">
                      <span className="detail-tag">
                        <Building size={14} />
                        <span>{selectedJob.experienceLevel}</span>
                      </span>
                      <span className="detail-tag">
                        <DollarSign size={14} />
                        <span>{selectedJob.salaryRange}</span>
                      </span>
                      <span className="detail-tag">
                        <Clock size={14} />
                        <span>{selectedJob.applicantCount || 0} applicants</span>
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
                      onClick={() => handleToggleSave(selectedJob.id)}
                    >
                      <Bookmark size={16} />
                      <span>Save Job</span>
                    </button>
                  </div>
                </div>

                <div className="details-divider" />

                <div className="details-section">
                  <h3>About the job</h3>
                  <p className="job-desc-text">{selectedJob.description}</p>
                </div>

                {selectedJob.requirements && (
                  <div className="details-section">
                    <h3>Key Requirements</h3>
                    <p className="job-desc-text">{selectedJob.requirements}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="card empty-sub-state">Select a job on the left to view details</div>
            )}
          </div>
        </div>
      )}

      {/* ──────────────── TAB 2: MY APPLICATIONS ──────────────── */}
      {activeTab === 'APPLICATIONS' && (
        <div className="card section-card">
          <div className="section-header">
            <h3>Submitted Applications</h3>
          </div>
          {myApplications.length === 0 ? (
            <div className="empty-sub-state">
              You haven't applied to any roles yet. Explore open roles above!
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

      {/* ──────────────── TAB 3: SAVED JOBS ──────────────── */}
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
                        setSelectedJob(job);
                        setShowApplyModal(true);
                      }}
                    >
                      Apply
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline btn-sm text-danger"
                      onClick={() => handleToggleSave(job.id)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ──────────────── MODAL: POST A JOB ──────────────── */}
      {showPostModal && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Post a Job Opportunity</h3>
              <button type="button" className="btn-icon" onClick={() => setShowPostModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handlePostJob}>
              <div className="modal-body">
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
                <div className="form-group">
                  <label>Company *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Stripe"
                    value={newJob.company}
                    onChange={e => setNewJob({ ...newJob, company: e.target.value })}
                  />
                </div>
                <div className="form-row-2">
                  <div className="form-group">
                    <label>Workplace Type</label>
                    <select
                      value={newJob.location}
                      onChange={e => setNewJob({ ...newJob, location: e.target.value })}
                    >
                      <option value="Remote">Remote</option>
                      <option value="San Francisco, CA (Hybrid)">San Francisco, CA (Hybrid)</option>
                      <option value="New York, NY (On-site)">New York, NY (On-site)</option>
                      <option value="London, UK (Hybrid)">London, UK (Hybrid)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Employment Type</label>
                    <select
                      value={newJob.jobType}
                      onChange={e => setNewJob({ ...newJob, jobType: e.target.value })}
                    >
                      <option value="Full-time">Full-time</option>
                      <option value="Part-time">Part-time</option>
                      <option value="Contract">Contract</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label>Salary Range</label>
                  <input
                    type="text"
                    placeholder="e.g. $130,000 - $180,000 + Equity"
                    value={newJob.salaryRange}
                    onChange={e => setNewJob({ ...newJob, salaryRange: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Job Description *</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Describe role responsibilities, tech stack, team goals..."
                    value={newJob.description}
                    onChange={e => setNewJob({ ...newJob, description: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Key Requirements</label>
                  <textarea
                    rows={3}
                    placeholder="Qualifications, preferred experience, tools..."
                    value={newJob.requirements}
                    onChange={e => setNewJob({ ...newJob, requirements: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowPostModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Publish Job
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ──────────────── MODAL: EASY APPLY ──────────────── */}
      {showApplyModal && selectedJob && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Easy Apply: {selectedJob.title}</h3>
              <button type="button" className="btn-icon" onClick={() => setShowApplyModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleApply}>
              <div className="modal-body">
                <div className="apply-job-header">
                  <strong>{selectedJob.company}</strong> • <span>{selectedJob.location}</span>
                </div>
                <div className="form-group">
                  <label>Full Name *</label>
                  <input
                    type="text"
                    required
                    value={applyForm.applicantName}
                    onChange={e => setApplyForm({ ...applyForm, applicantName: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Email Address *</label>
                  <input
                    type="email"
                    required
                    value={applyForm.applicantEmail}
                    onChange={e => setApplyForm({ ...applyForm, applicantEmail: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Resume / Portfolio URL</label>
                  <input
                    type="url"
                    placeholder="https://drive.google.com/... or LinkedIn profile"
                    value={applyForm.resumeUrl}
                    onChange={e => setApplyForm({ ...applyForm, resumeUrl: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Note to Hiring Manager</label>
                  <textarea
                    rows={3}
                    placeholder="Introduce yourself and explain why you're excited for this role..."
                    value={applyForm.coverNote}
                    onChange={e => setApplyForm({ ...applyForm, coverNote: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowApplyModal(false)}>
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
