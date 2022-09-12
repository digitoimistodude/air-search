<div class="search-item search-item-<?php echo esc_attr( get_post_type( $id ) ) ?>">
  <a href="<?php echo esc_url( get_the_permalink( $id ) ) ?>" class="global-link" tabindex="-1"></a>
  <h3>
    <a href="<?php echo esc_url( get_the_permalink( $id ) ) ?>">
      <?php echo esc_html( get_the_title( $id ) ) ?>
    </a>
  </h3>
</div>