document.addEventListener('alpine:init', () => {

  function baseCalculator(endpoint) {
    return {
      availableMaterials: [],
      materialMode: 'preloaded',
      material: '',
      isotopes: [{ symbol: '', mass_number: 0, mass_fraction: '' }],
      result: null,
      loading: false,
      error: null,
      chart: null,

      async fetchMaterials() {
        const res = await fetch('/api/materials');
        const { materials } = await res.json();
        this.availableMaterials = materials;
        this.material = materials[0] ?? '';
      },

      validateMaterial() {
        if (this.materialMode === 'custom' && this.isotopes.some(iso => !iso.symbol.trim() || !(iso.mass_fraction > 0)))
          return 'Material Composition: isotopes require a symbol and a mass fraction greater than 0.';
        return null;
      },

      buildMaterial() {
        return this.materialMode === 'preloaded'
          ? { name: this.material }
          : { isotopes: this.isotopes };
      },

      async calculate() {
        const err = this.validate();
        if (err) { this.error = err; return; }
        this.loading = true;
        this.error = null;
        this.result = null;
        try {
          const res = await fetch(endpoint, {
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
        if (!this.result?.neutron_spectrum || Object.keys(this.result.neutron_spectrum).length === 0) return;

        const points = Object.entries(this.result.neutron_spectrum)
          .map(([e, y]) => ({ x: parseFloat(e), y }))
          .sort((a, b) => a.x - b.x);

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
              x: { title: { display: true, text: 'Energy (keV)' }, ticks: { stepSize: 1000 } },
              y: {
                title: { display: true, text: 'Yield (n/decay)' },
                ticks: { callback: (value) => value.toExponential(5) },
              },
            },
            plugins: {
              legend: { display: false },
              tooltip: { callbacks: { label: (ctx) => `(${ctx.parsed.x}, ${ctx.parsed.y.toExponential(5)})` } },
            },
          }
        });
      },
    };
  }

  Alpine.data('alphaCalculator', () => ({
    ...baseCalculator('/api/alpha_lists'),
    availableElements: [],
    mode: 'preloaded',
    element: '',
    customAlphas: [{ energy: '', probability: '' }],

    async init() {
      const [alphaLists] = await Promise.all([
        fetch('/api/alpha_lists'),
        this.fetchMaterials(),
      ]);
      const { elements } = await alphaLists.json();
      this.availableElements = elements;
      this.element = elements[0] ?? '';
      this.$watch('result', () => this.renderChart());
    },

    validate() {
      return this.validateMaterial()
        ?? (this.mode === 'custom' && this.customAlphas.some(a => !(a.energy > 0) || !(a.probability > 0))
          ? 'Alpha energy: each entry requires an energy and probability greater than 0.'
          : null);
    },

    buildAlphaList() {
      return this.mode === 'preloaded'
        ? { element: this.element }
        : { alphas: Object.fromEntries(this.customAlphas.map(a => [a.energy, a.probability])) };
    },

    buildRequest() {
      return { material: this.buildMaterial(), alpha_list: this.buildAlphaList() };
    },
  }));

  Alpine.data('chainCalculator', () => ({
    ...baseCalculator('/api/chain_lists'),
    availableChains: [],
    mode: 'preloaded',
    chain: '',
    customChain: [{ isotope: '', branching_ratio: '' }],

    async init() {
      const [chainLists] = await Promise.all([
        fetch('/api/chain_lists'),
        this.fetchMaterials(),
      ]);
      const { chains } = await chainLists.json();
      this.availableChains = chains;
      this.chain = chains[0] ?? '';
      this.$watch('result', () => this.renderChart());
    },

    validate() {
      return this.validateMaterial()
        ?? (this.mode === 'custom' && this.customChain.some(c => !c.isotope.trim() || !(c.branching_ratio > 0))
          ? 'Chain List: each entry requires an isotope and a branching ratio greater than 0.'
          : null);
    },

    buildChainList() {
      return this.mode === 'preloaded'
        ? { element: this.chain }
        : { chain: Object.fromEntries(this.customChain.map(c => [c.isotope, c.branching_ratio])) };
    },

    buildRequest() {
      return { material: this.buildMaterial(), chain_list: this.buildChainList() };
    },
  }));

});
