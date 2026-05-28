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

    validate() {
      if (this.isotopes.some(iso => !iso.symbol.trim() || !(iso.mass_fraction > 0)))
        return 'Material Composition: isotopes require a symbol and a mass fraction greater than 0.';
      if (this.mode === 'custom' && this.customAlphas.some(a => !(a.energy > 0) || !(a.probability > 0)))
        return 'Alpha energy: each entry requires an energy and probability greater than 0.';
      return null;
    },

    buildRequest() {
      const alpha_list = this.mode === 'preloaded'
        ? { element: this.element }
        : { alphas: Object.fromEntries(this.customAlphas.map(a => [a.energy, a.probability])) };
      return { material: this.isotopes, alpha_list };
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

    validate() {
      if (this.isotopes.some(iso => !iso.symbol.trim() || !(iso.mass_fraction > 0)))
        return 'Material composition: isotopes require a symbol and a mass fraction greater than 0.';
      if (this.mode === 'custom' && this.customChain.some(c => !c.isotope.trim() || !(c.branching_ratio > 0)))
        return 'Chain List: each entry requires an isotope and a branching ratio greater than 0.';
      return null;
    },

    buildRequest() {
      const chain_list = this.mode === 'preloaded'
        ? { element: this.chain }
        : { chain: Object.fromEntries(this.customChain.map(c => [c.isotope, c.branching_ratio])) };
      return { material: this.isotopes, chain_list };
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
  }));

});
