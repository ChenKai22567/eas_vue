export function createAdaptiveTable (verticalOffset, minimumHeight = 160) {
  return {
    data () {
      return {
        adaptiveViewportHeight: window.innerHeight
      }
    },
    computed: {
      adaptiveTableHeight () {
        return Math.max(minimumHeight, this.adaptiveViewportHeight - verticalOffset)
      }
    },
    mounted () {
      window.addEventListener('resize', this.syncAdaptiveViewport, { passive: true })
    },
    beforeDestroy () {
      window.removeEventListener('resize', this.syncAdaptiveViewport)
    },
    methods: {
      syncAdaptiveViewport () {
        this.adaptiveViewportHeight = window.innerHeight
      }
    }
  }
}
