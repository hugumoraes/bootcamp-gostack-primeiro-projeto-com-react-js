import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import api from '../../services/api';

import Container from '../../components/Container';
import { Loading, Owner, IssueList, PreviousButton } from './styles';

const propTypes = {
  match: PropTypes.shape({
    params: PropTypes.shape({
      repository: PropTypes.string,
    }),
  }).isRequired,
};

export default class Repository extends Component {
  constructor(props) {
    super(props);
    this.state = {
      repository: {},
      issues: [],
      loading: true,
      issueState: 'open',
      page: 1,
      firstPage: true,
    };
  }

  async componentDidMount() {
    const { match } = this.props;
    const { issueState, page } = this.state;

    const repoName = decodeURIComponent(match.params.repository);

    const [repository, issues] = await Promise.all([
      api.get(`/repos/${repoName}`),
      api.get(`/repos/${repoName}/issues`, {
        params: {
          state: issueState,
          per_page: 5,
          page,
        },
      }),
    ]);

    this.setState({
      repository: repository.data,
      issues: issues.data,
      loading: false,
    });
  }

  async componentDidUpdate(_, prevState) {
    const { issueState, page } = this.state;

    if (prevState.issueState !== issueState || prevState.page !== page) {
      const { match } = this.props;

      const repoName = decodeURIComponent(match.params.repository);

      const [repository, issues] = await Promise.all([
        api.get(`/repos/${repoName}`),
        api.get(`/repos/${repoName}/issues`, {
          params: {
            state: issueState,
            per_page: 5,
            page,
          },
        }),
      ]);

      this.setState({
        repository: repository.data,
        issues: issues.data,
        loading: false,
      });
    }
  }

  handleIssueState = (issueState) => {
    this.setState({ issueState });
  };

  handlePage = (command) => {
    const { page } = this.state;

    if (command === 'prev' && page === 1) return;

    if (command === 'next') this.setState({ page: page + 1, firstPage: false });
    if (command === 'prev') {
      if (page - 1 === 1) this.setState({ firstPage: true });

      this.setState({ page: page - 1 });
    }
  };

  render() {
    const { repository, issues, loading, firstPage } = this.state;

    if (loading) {
      return <Loading>Carregando</Loading>;
    }

    return (
      <Container>
        <Owner>
          <Link to="/">Voltar aos repositórios</Link>
          <button type="button" onClick={() => this.handleIssueState('open')}>
            Open
          </button>
          <button type="button" onClick={() => this.handleIssueState('closed')}>
            Closed
          </button>
          <button type="button" onClick={() => this.handleIssueState('all')}>
            All
          </button>
          <img src={repository.owner.avatar_url} alt={repository.owner.login} />
          <h1>{repository.name}</h1>
          <p>{repository.description}</p>
        </Owner>

        <IssueList>
          {issues.map((issue) => (
            <li key={String(issue.id)}>
              <img src={issue.user.avatar_url} alt={issue.user.login} />
              <div>
                <strong>
                  <a href={issue.html_url}>{issue.title}</a>
                  {issue.labels.map((label) => (
                    <span key={String(label.id)}>{label.name}</span>
                  ))}
                </strong>
                <p>{issue.user.login}</p>
              </div>
            </li>
          ))}
        </IssueList>
        <PreviousButton
          firstPage={firstPage}
          type="button"
          onClick={() => this.handlePage('prev')}
        >
          Previous
        </PreviousButton>
        <button type="button" onClick={() => this.handlePage('next')}>
          Next
        </button>
      </Container>
    );
  }
}

Repository.propTypes = propTypes;
