document.addEventListener('alpine:init', () => {

  Alpine.data('alphaCalculator', () => ({
    availableElements: [],
    availableMaterials: [],
    mode: 'preloaded',
    materialMode: 'preloaded',
    element: '',
    material: '',
    customAlphas: [{ energy: '', probability: '' }],
    isotopes: [{ symbol: '', mass_number: 0, mass_fraction: '' }],
    result: null,
    loading: false,
    error: null,
    chart: null,

    async init() {
      const [alphaRes, materialRes] = await Promise.all([
        fetch('/api/alpha_lists'),
        fetch('/api/materials'),
      ]);
      const { elements } = await alphaRes.json();
      const { materials } = await materialRes.json();
      this.availableElements = elements;
      this.element = elements[0] ?? '';
      this.availableMaterials = materials;
      this.material = materials[0] ?? '';
      this.$watch('result', () => this.renderChart());
    },

    validate() {
      if (this.materialMode === 'custom' && this.isotopes.some(iso => !iso.symbol.trim() || !(iso.mass_fraction > 0)))
        return 'Material Composition: isotopes require a symbol and a mass fraction greater than 0.';
      if (this.mode === 'custom' && this.customAlphas.some(a => !(a.energy > 0) || !(a.probability > 0)))
        return 'Alpha energy: each entry requires an energy and probability greater than 0.';
      return null;
    },

    buildRequest() {
      const material = this.materialMode === 'preloaded'
        ? { name: this.material }
        : { isotopes: this.isotopes };
      const alpha_list = this.mode === 'preloaded'
        ? { element: this.element }
        : { alphas: Object.fromEntries(this.customAlphas.map(a => [a.energy, a.probability])) };
      return { material, alpha_list };
    },

    async calculate() {
      const err = this.validate();
      if (err) { this.error = err; return; }
      this.loading = true;
      this.error = null;
      this.result = null;
      try {
        const res = await fetch('/api/alpha_lists', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(this.buildRequest()),
        });
        if (!res.ok) throw new Error((await res.json()).detail ?? 'Calculation failed');
        this.result = await res.json();
      } catch (e) {
        this.error = e.message;
      } finally {
        this.loading = false;
      }
    },

    renderChart() {
      if (this.chart) {
        this.chart.destroy();
        this.chart = null;
      }
      if (!this.result?.neutron_spectrum) return;

      const points = Object.entries(this.result.neutron_spectrum)
        .map(([e, y]) => ({ x: parseFloat(e), y }))
        .sort((a, b) => a.x - b.x);

      if (points.length === 0) return;

      this.chart = new Chart(this.$refs.spectrumChart, {
        type: 'scatter',
        data: {
          datasets: [{
            label: 'Neutron Yield',
            data: points,
            showLine: true,
            fill: false,
            borderColor: '#0d6efd',
            pointRadius: 2,
          }]
        },
        options: {
          responsive: true,
          scales: {
            x: {
              title: { display: true, text: 'Energy (keV)' } ,
              ticks: { stepSize: 1000 }
            },
            y: {
              title: { display: true, text: 'Yield (n/decay)' },
              ticks: { callback: (value) => value.toExponential(5) },
            },
          },
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (ctx) => `(${ctx.parsed.x}, ${ctx.parsed.y.toExponential(5)})`,
              }
            }
          },
        }
      });
    },
  }));

  Alpine.data('chainCalculator', () => ({
    availableChains: [],
    availableMaterials: [],
    mode: 'preloaded',
    materialMode: 'preloaded',
    chain: '',
    material: '',
    customChain: [{ isotope: '', branching_ratio: '' }],
    isotopes: [{ symbol: '', mass_number: 0, mass_fraction: '' }],
    result: null,
    loading: false,
    error: null,
    chart: null,

    async init() {
      const [chainRes, materialRes] = await Promise.all([
        fetch('/api/chain_lists'),
        fetch('/api/materials'),
      ]);
      const { chains } = await chainRes.json();
      const { materials } = await materialRes.json();
      this.availableChains = chains;
      this.chain = chains[0] ?? '';
      this.availableMaterials = materials;
      this.material = materials[0] ?? '';
      this.$watch('result', () => this.renderChart());
    },

    validate() {
      if (this.materialMode === 'custom' && this.isotopes.some(iso => !iso.symbol.trim() || !(iso.mass_fraction > 0)))
        return 'Material composition: isotopes require a symbol and a mass fraction greater than 0.';
      if (this.mode === 'custom' && this.customChain.some(c => !c.isotope.trim() || !(c.branching_ratio > 0)))
        return 'Chain List: each entry requires an isotope and a branching ratio greater than 0.';
      return null;
    },

    buildRequest() {
      const material = this.materialMode === 'preloaded'
        ? { name: this.material }
        : { isotopes: this.isotopes };
      const chain_list = this.mode === 'preloaded'
        ? { element: this.chain }
        : { chain: Object.fromEntries(this.customChain.map(c => [c.isotope, c.branching_ratio])) };
      return { material, chain_list };
    },

    async calculate() {
      const err = this.validate();
      if (err) { this.error = err; return; }
      this.loading = true;
      this.error = null;
      this.result = null;
      try {
        const res = await fetch('/api/chain_lists', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(this.buildRequest()),
        });
        if (!res.ok) throw new Error((await res.json()).detail ?? 'Calculation failed');
        this.result = await res.json();
      } catch (e) {
        this.error = e.message;
      } finally {
        this.loading = false;
      }
    },

    renderChart() {
      if (this.chart) {
        this.chart.destroy();
        this.chart = null;
      }
      if (!this.result?.neutron_spectrum) return;

      const points = Object.entries(this.result.neutron_spectrum)
        .map(([e, y]) => ({ x: parseFloat(e), y }))
        .sort((a, b) => a.x - b.x);

      if (points.length === 0) return;

      this.chart = new Chart(this.$refs.spectrumChart, {
        type: 'scatter',
        data: {
          datasets: [{
            label: 'Neutron Yield',
            data: points,
            showLine: true,
            fill: false,
            borderColor: '#0d6efd',
            pointRadius: 2,
          }]
        },
        options: {
          responsive: true,
          scales: {
            x: {
              title: { display: true, text: 'Energy (keV)' } ,
              ticks: { stepSize: 1000 }
            },
            y: {
              title: { display: true, text: 'Yield (n/decay)' },
              ticks: { callback: (value) => value.toExponential(5) },
            },
          },
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (ctx) => `(${ctx.parsed.x}, ${ctx.parsed.y.toExponential(5)})`,
              }
            }
          },
        }
      });
    },
  }));

});
