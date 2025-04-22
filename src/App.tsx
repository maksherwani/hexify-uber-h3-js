import './App.css';
import MapLibreWithCoverage from './mapping/map-coverage-with-hex';

function App() {
  return (
    <div
      style={{
        height: '100vh',
        width: '100vw',
      }}
    >
      <MapLibreWithCoverage />
    </div>
  );
}

export default App;
