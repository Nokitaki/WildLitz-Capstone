
import React from 'react';
import styles from '../../styles/components/GameErrorBoundary.module.css';

class GameErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null 
    };
  }

  static getDerivedStateFromError(error) {
   
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
   
    console.error('Game Error Caught by Boundary:', error, errorInfo);
    
    this.setState({
      error: error,
      errorInfo: errorInfo
    });

   
  }

  handleRetry = () => {
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null 
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className={styles.errorContainer}>
          <div className={styles.errorContent}>
            <div className={styles.errorIcon}>😵</div>
            <h2 className={styles.errorTitle}>Oops! Something went wrong</h2>
            <p className={styles.errorMessage}>
              Don't worry! Your progress is saved. Let's get you back to learning!
            </p>
            
            <div className={styles.errorActions}>
              <button 
                className={styles.retryButton}
                onClick={this.handleRetry}
              >
                🔄 Try Again
              </button>
              <button 
                className={styles.homeButton}
                onClick={() => window.location.href = '/'}
              >
                🏠 Go Home
              </button>
            </div>

          
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className={styles.errorDetails}>
                <summary>Error Details (Development Only)</summary>
                <pre className={styles.errorStack}>
                  {this.state.error.toString()}
                  <br />
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default GameErrorBoundary;