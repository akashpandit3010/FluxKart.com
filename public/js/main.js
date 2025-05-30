document.addEventListener('DOMContentLoaded', function() 
{
    const mobileMenuButton = document.getElementById('mobileMenuButton');
    const mobileMenu = document.getElementById('mobileMenu');
    
    if (mobileMenuButton && mobileMenu) 
    {
        mobileMenuButton.addEventListener('click', function() 
        {
            mobileMenu.classList.toggle('hidden');
        });
    }
    if (typeof initCart !== 'undefined') 
    {
        initCart();
    }
    console.log('Main JS loaded');
});