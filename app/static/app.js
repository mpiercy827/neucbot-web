document.addEventListener('alpine:init', () => {

  Alpine.data('alphaCalculator', () => ({
    availableElements: [],
    mode: 'preloaded',
    element: '',
    customAlphas: [{ energy: '', probability: '' }],
    isotopes: [{ symbol: '', mass_number: 0, mass_fraction: '' }],
    result: null,
    loading: false,
    error: null,

    async init() {
      const res = await fetch('/api/alpha_lists');
      const { elements } = await res.json();
      this.availableElements = elements;
      this.element = elements[0] ?? '';
    },

    buildRequest() {
      const alpha_list = this.mode === 'preloaded'
        ? { element: this.element }
        : { alphas: Object.fromEntries(this.customAlphas.map(a => [a.energy, a.probability])) };
      return { material: this.isotopes, alpha_list };
    },

    async calculate() {
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
  }));

  Alpine.data('chainCalculator', () => ({
    availableChains: [],
    mode: 'preloaded',
    chain: '',
    customChain: [{ isotope: '', branching_ratio: '' }],
    isotopes: [{ symbol: '', mass_number: 0, mass_fraction: '' }],
    result: null,
    loading: false,
    error: null,

    async init() {
      const res = await fetch('/api/chain_lists');
      const { chains } = await res.json();
      this.availableChains = chains;
      this.chain = chains[0] ?? '';
    },

    buildRequest() {
      const chain_list = this.mode === 'preloaded'
        ? { element: this.chain }
        : { chain: Object.fromEntries(this.customChain.map(c => [c.isotope, c.branching_ratio])) };
      return { material: this.isotopes, chain_list };
    },

    async calculate() {
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
  }));

});
