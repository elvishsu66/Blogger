/*
 * Functions for blogger
 * Author: Elvis Hsu
 * Url:www.elvishsu66.com 
 */
  (function($){
  	// Provide actions to scroll back to top of the screen
    $.fn.backToTop = function(options) {
      var defaults = {
        text: 'To Top',
        min: 200,
        inDelay:600,
        outDelay:400,
        containerID: 'backToTop',
        scrollSpeed: 1200,
        easingType: 'linear'
      };
      var settings = $.extend(defaults, options);
      var containerIDhash = '#' + settings.containerID;
      $('body').append('<a href="#" id="'+settings.containerID+'" title="Back to top">'+settings.text+'</a>');
      $(containerIDhash).hide().click(function(){
        $('html, body').animate({scrollTop:0}, settings.scrollSpeed, settings.easingType);
        return false;
      });

      $(window).scroll(function() {
        var sd = $(window).scrollTop();
        if(typeof document.body.style.maxHeight === "undefined") {
          $(containerIDhash).css({
            'position': 'absolute',
            'top': $(window).scrollTop() + $(window).height() - 20
          });
        }
        if ( sd > settings.min ) 
          $(containerIDhash).fadeIn(settings.inDelay);
        else 
          $(containerIDhash).fadeOut(settings.Outdelay);
      });
    };

	$.fn.flickrGallery=function(config){
		var me = this,
		 // variables
	    	photos = [],
	    	photosLoaded = 0,
	    	pagesLoaded = 0,
	    	totalPages = 0,
	    	currentPage = 1,
	    	maxPages = 2,
	    	minHeight = 150,
	    	maxHeight = 600,
	    	lastWidth = 0, // last width			
			rowClassName = 'row', // the row
			isLoading = false,
			resized = false,
			debug = false,
			extras = ['url_n','url_c','url_m','url_z','owner_name'];

		var settings = $.extend(true,{
			rows: 5,
			rowHeight: minHeight,
			borderWidth: 5,
			shuffle: true,
			maxPages: maxPages,
			loadOnScroll:false,
			cb_url:'url_c',
			server: 'https://api.flickr.com/services/rest/', // flickr api server
			// query strings
			params:{
		    	method:  'flickr.people.getPhotos',
		    	api_key: 'ad2e1cc1d51162a8ee4ee4b022a711f4',
		    	user_id: '91190543@N02',
		    	//tags: 	 'canon',
		    	extras:  'url_n,url_c,url_m,url_z,owner_name',
		    	format:  'json',
		    	page: 1,
		    	per_page: 100, // max 500
		    	jsoncallback:'?'
		    }
		},config);

		// Check the extra parameters
		var e = settings.params.extras.split(',');
		var new_extra = $.merge(e,extras);
		extras = $.unique(new_extra);
		settings.params.extras = extras.join(',');

		// set max page from settings
		maxPages = settings.maxPages;
		settings.rowHeight = Math.min(maxHeight, Math.max(minHeight, settings.rowHeight));
		currentPage = settings.page;
		// return the object
		return initGallery();

		// init gallery
		function initGallery(){  				
			// get colorbox plugin and start to rock and roll
	  		$.getScript('https://dl.dropboxusercontent.com/u/99319532/Blogger/host/colorbox.min.js',function(){
	  		 	// get the colorbox style sheet
	  		 	$('head').append("<link href='https://dl.dropboxusercontent.com/u/99319532/Blogger/host/colorbox.min.css' rel='stylesheet'/>");
	  		 	// make container position relative
	  		 	me.css({'position':'relative'});
				// append loading text
				me.append('<center id="loading" style="padding:20px;z-index:20000;position:absolute;bottom:30px;right:30px;display:none;background-color:#fff;">Loading photos...</center>');
				// get photos from filckr
				getPhotos();
			    // check window resize
			    $(window).resize(function() { 
			        var cw = me.innerWidth();        
			        // test to see if the window resize is big enough to deserve a reprocess
			        if(cw * 1.1 < lastWidth || cw * 0.9 > lastWidth ){
			            // if so call method
			            updateRows();
			        };
			    });

			    if(settings.loadOnScroll){
				    $( window ).scroll(function() {
					  if(levelReached()){
					  	if(photosLoaded < photos.length){
					  		addRows(5);
							updateRows();
						}else{
							if(pagesLoaded < maxPages){
								if(!isLoading){
									settings.params.page++;
									addRows(5);
									getPhotos();
								}
							}
						}
					  }
					});
				}
			});
			return me;
		};

		function addRows(rows){
			// insert rows
			for(var i=1; i <= rows; i++){
				me.append($('<div/>',{'class':rowClassName}));
			}			
		}

		// get photos from flickr
		function getPhotos(){
			if(!isLoading){
				isLoading = true;
				$('#loading').fadeIn();
			    // get the information of photos
				$.ajax({
					url: settings.server + '?' + decodeURIComponent($.param(settings.params)),
					type: 'GET',
					cache: true,
					dataType: 'jsonp',
					success: function(data) {
						if(!data.photos){
							alert('Message from Flickr: '+data.message);
							return;
						}
						$('#loading').fadeOut();
						// get current page
						currentPage = data.photos.page;
						// get total pages
						totalPages = data.photos.pages;
						// redefine max page
						maxPages = Math.min(maxPages, totalPages);
						// shuffle array
						if(settings.shuffle){
							data.photos.photo.sort(function() { return 0.5 - Math.random() });
						}
						// the list of photos
						$.merge(photos, data.photos.photo);
						// insert rows
						for(var i=1; i <= settings.rows; i++){
							me.append($('<div/>',{'class':rowClassName}));
						}
						pagesLoaded++;
						// update the rows
						updateRows();
						isLoading = false;
					}
				});	
			}
		}

	    // only call this when either the data is loaded, or the windows resizes by a chunk
	    function updateRows (){
	    	if(lastWidth != me.innerWidth()){
	    		resized = true;
	    	}
	    	// get the container width
	        lastWidth = me.innerWidth();
	        // process rows
	        processPhotos();
	        // set the row width
	        $('.'+rowClassName).width(lastWidth);
	        resized = false;
	    };

	  	// process flicker photos
		function processPhotos(){
			if(!photos)
				return;
			var photoRange = photos;
			photosLoaded = 0;
			// find the rows that contain the images
			var d = $('.'+rowClassName);
			// get row width - this is fixed.
			var w = lastWidth;
			// initial height - effectively the maximum height +/- 10%;
			var h = Math.min(settings.rowHeight,Math.floor(w / 5));
			// margin width
			var border = settings.borderWidth;	
			// store relative widths of all images (scaled to match estimate height above)
			var ws = [];
			$.each(photoRange, function(key, val) {
				var wt = parseInt(val.width_n, 10);
				var ht = parseInt(val.height_n, 10);
				if(ht != h) { 
					wt = Math.floor(wt * (h / ht)); 
				}
				ws.push(wt);
			});

		    // total number of images appearing in all previous rows
		    var baseLine = 0; 
		    var rowNum = 0;

			while(rowNum++ < d.length){
				// get the element
				var dRow = d.eq(rowNum-1);
				// clear the row
				dRow.empty();
				// number of images appearing in this row
				var c = 0; 
				// total width of images in this row - including margins
				var tw = 0;		
				// calculate width of images and number of images to view in this row.
				while(tw * 1.1 < w){
					tw += ws[baseLine + c++] + border * 2;
				};
	            // if this is the last row, then skip it
	            if(baseLine + c >= photoRange.length){
	            	// inform not to load again when scrolling
	            	//photosLoaded = photoRange.length;
	            	photosLoaded += c;
	            	return;
	            }
				// Ratio of actual width of row to total width of images to be used.
				var r = w / tw; 		
				// image number being processed
				var i = 0;
				// reset total width to be total width of processed images
				tw = 0;
				// new height is not original height * ratio
				var ht = Math.floor(h * r);
				// set row height to actual height + margins
				dRow.height(ht + border * 2);	

				while( i < c ){
					var photo = photoRange[baseLine + i];
					// if we have a valid photo
					if(photo){
						// Calculate new width based on ratio
						var wt = Math.floor(ws[baseLine + i] * r);
						// add to total width with margins
						tw += wt + border * 2;
			                // Create image, set src, width, height and margin
		                var purl = photo.url_n;
		                if( wt > photo.width_n * 1.2 || ht > photo.height_n * 1.2 ) 
		                	purl = photo.url_m;
		                if( wt > photo.width_m * 1.2 || ht > photo.height_m * 1.2 ) 
		                	purl = photo.url_z;
		                if( wt > photo.width_z * 1.2 || ht > photo.height_z * 1.2 ) 
		                	purl = photo.url_l;
						// create a tile block, width, height and margin
						var tile = $('<div/>', {'class': 'tile', 'width': wt, 'height': ht})
									.css({'width': wt + 'px', 'height': ht +'px', 'margin':border + 'px', 'float':'left','position':'relative'});
						// create image, set src, width, height
						var img = $('<img/>', {'class': 'photo', 'src': purl, 'width': wt, 'height': ht});
						// put image into tile
						tile.append(img);
						// wrap the link for the image - colorbox
						img.wrap($('<a/>',{href:photo[settings.cb_url] || photo.url_c, rel:'cb','class':'cb',title:photo.title}));
						// create caption 
						var caption = $('<div/>',{'class':'caption'})
										.css({
										    'position': 'absolute',
										    'left': '0',
										    'bottom': '0',
										    'background-color': 'rgba(0,0,0,0.6)',		    
										    'padding':'10px',
										    'display':'none',
										    'color':'white'
										});
						// add text to caption
						caption.text(photo.title);
						// add caption to tile
						tile.append(caption);
						if(debug){
							var id = $('<span/>').css({'position':'absolute','z-index':'100','color':'red','top':'10px','left':'10px'});
							tile.append(id);
							id.text(photosLoaded);
						}
						// add the tile to the row
						dRow.append(tile);						
					}	
					i++;
					photosLoaded++;
				};
				// init colorbox
				$('.cb').colorbox();
				// if total width is slightly smaller than 
				// actual div width then add 1 to each 
				// photo width till they match
				i = 0;
				while( tw < w ){
					var img1 = dRow.find('div.tile:nth-child(' + (i + 1) + ')');
					img1.width(img1.width() + 1);
					i = (i + 1) % c;
					tw++;
				};
				// if total width is slightly bigger than 
				// actual div width then subtract 1 from each 
				// photo width till they match
				i = 0;
				while( tw > w ) {
					var img2 = dRow.find('div.tile:nth-child(' + (i + 1) + ')');
					img2.width(img2.width() - 1);
					i = (i + 1) % c;
					tw--;
				};		

				baseLine += c;
			}
			// hook caption events
		    $('.tile').mouseenter(function(){
		        $(this).children('.caption').fadeIn();
		    }).mouseleave(function(){
		        $(this).children('.caption').fadeOut();
		    });
		};

	    // levelReached function taken from infiniteScroll jquery plugin
	    // https://github.com/holtonma/infini_scroll
    	function levelReached(){
	        // is it low enough to add elements to bottom?
	        var pageHeight = Math.max(document.body.scrollHeight || document.body.offsetHeight);
	        var viewportHeight = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight || 0;
	        var scrollHeight = $(document).scrollTop();
	        // Trigger for scrolls within 20 pixels from page bottom
	        return pageHeight - viewportHeight - scrollHeight < 10;
    	};
	};

	$.fn.relatedPosts=function(config){
		var me = this,
			blogId,
			postId;

		var settings = $.extend(true,{
			url: 'http://www.elvishsu66.com',
			postId:'',
			labels:[],
			title:'Related Posts: ',
			itemClass: 'related_item',
			wrapperClass: 'related_items_wapper',
			titleClass: 'title',
			shuffle:true,
			thumbUsePost:true,
			thumbWidth:200,
			thumbHeight:150,
			maxPosts: 3
		},config);

		if(!$.isArray(settings.labels)){
			settings.labels = settings.labels.trim().split(',');
		}

		return init();

		function init(){
			$.ajax({
			    url: settings.url + '/feeds/posts/default?alt=json&max-results=500',
			    type: 'get',
			    dataType: "jsonp",
			    cache:true,
			    success: function(data){
			    	// get the blog feed id
			    	blogId = data.feed.id.$t;
			    	if(settings.postId !== ''){
				    	// get the current post id
				    	postId = blogId + '.post-' + settings.postId;
			    	}
			    	// get related posts
			    	var posts = findRelatedPosts(data.feed.entry);
			        // add section title
			        me.append($('<h2/>').text(settings.title));
			        var wrapper = $('<div/>',{'class':settings.wrapperClass});
			    	// construct the output
			        for (var i = 0; i < posts.length; i++){
			        	var entry = posts[i];
			        	var href = getLink(entry);
			        	// the link
			        	var link = $('<a/>',{'href':href});
			        	// the thumbnail
			        	var thumb = findThumbnail(entry,entry.title.$t);
			        	// the post title
			        	var pTitle = $('<div/>',{'class':settings.titleClass});
			        	// the item block
			        	var div = $('<div/>',{'class':settings.itemClass});
			        	// add thumbnail
			        	div.append(thumb);
			            // wrap the link
			            thumb.wrap(link);
			        	// add post title
	                    div.append(pTitle);
	                    pTitle.append(link.text(entry.title.$t));
	                    // add the item block
			            wrapper.append(div);
			            div.click(function() { window.location = href; })
			        }
			        me.append(wrapper);
			        // clear the layout
			      	me.append('<div style="clear:both;"></div>');
			    }
			});			
		};
		// gets the entry link
		function getLink(entry){
			var href = '#';
			$.each(entry.link, function(i, v){
				if(v.rel=='alternate'){
					href = v.href;
					return false;
				};
			});
			return href;
		}

		// find related entries
		function findRelatedPosts(entries){
			var posts = [];
			var cats = settings.labels;

			for (var i = 0; i < entries.length; i++){
				if(!matchCurrentPost(entries[i])){				
					if(matchCategory(entries[i],cats)){
						posts.push(entries[i]);
					}
				}
			}
			// shuffle array
			if(settings.shuffle){
				posts.sort(function() { return 0.5 - Math.random() });
			}
			return posts.slice(0,settings.maxPosts);
		}

		function findThumbnail(entry, title){
			if(settings.thumbUsePost){
				if(entry.content){
					var div = $('<div/>').html(entry.content.$t);
					var imgs = div.find('img');
					if(imgs.length > 0){					
						return $('<img/>',{'src':imgs[0].src, 'alt': imgs[0].alt, 'title': title, 'width':settings.thumbWidth,'height':settings.thumbHeight});
					}
				}
			}else{
				return $('<img/>',{'src':entry.media$thumbnail.url,'title': title,'alt':title,'width':entry.media$thumbnail.width,'height':entry.media$thumbnail.height});
			}
		}

		function matchCurrentPost(entry){
			var match = false;
			if(postId){
				var id = entry.id.$t
				match = (id == postId);
			}else{
				var href = location.href.replace(location.hash,'');
				href = href.split('?')[0].toLowerCase();
				$.each(entry.link, function(i,v){
					if(v.rel == 'alternate'){
						if(v.href.toLowerCase() == href){
							match = true;
							return false;
						}
					}
				});
			}
			return match;
		}

		// find any matched category
		function matchCategory(entry, tags){
			if(entry.category){
				for(var i = 0; i < entry.category.length; i++){
					var tag = entry.category[i].term;
					if($.inArray(tag,tags) >= 0){
						return true;
					}
				}				
			}
			return false;
		}
	};
  })(jQuery);

  /*
   * Initialise the backToTop button
   */
  $(document).ready(function() {
  	// enable cache
	$.ajaxSetup({
	  cache: true
	});
	// blogger default layout
  	$('head').append("<link href='https://www.blogger.com/static/v1/widgets/3189209027-widget_css_bundle.css' rel='stylesheet' type='text/css'/>");
  	// the auth mode
  	$('head').append("<link href='https://www.blogger.com/dyn-css/authorization.css?targetBlogID=1691872865366176972&zx=c9e7689b-ae64-4cef-8de3-b34dc2d33b1a' rel='stylesheet' type='text/css'/>");
 
  	// load jquery ui
  	$.getScript('http://ajax.googleapis.com/ajax/libs/jqueryui/1.10.3/jquery-ui.min.js',function(){
  		$().backToTop({ easingType: 'easeOutQuart' });
  	});
  	
  	// if we need syntax highliter
  	if($('pre').length > 0){
	  	// add syntax highlighter
	  	var path = 'https://dl.dropboxusercontent.com/u/99319532/Blogger/host/syntaxhighlighter/';
	  	var jsPath = path + 'scripts/';
	  	var cssPath = path + 'styles/'
	    // style sheets
	    $('head').append("<link href='" + path + "all.css' rel='stylesheet'/>");
	  	//shCore.js
	    $.getScript(path + 'all.js', function(){
	    	// auto loader
			function path(){
			  var args = arguments,
			      result = [];
			       
			  for(var i = 0; i < args.length; i++)
			      result.push(args[i].replace('@', jsPath));
			       
			  return result
			};
			SyntaxHighlighter.autoloader.apply(null, path(
			  'cpp c                  @shBrushCpp.min.js',
			  'c# c-sharp csharp      @shBrushCSharp.min.js',
			  'css                    @shBrushCss.min.js',
			  'js jscript javascript  @shBrushJScript.min.js',
			  'php                    @shBrushPhp.min.js',
			  'text plain             @shBrushPlain.min.js',
			  'sql                    @shBrushSql.min.js',
			  'xml xhtml xslt html    @shBrushXml.min.js'
			));
	  		// start the code
	  		SyntaxHighlighter.config.bloggerMode = true; 
			SyntaxHighlighter.all();	    	
	    });
     };
 
  	// if we are in Photography page
  	if($('#fGallery').length > 0){
  		var config;
  		if(typeof flickrConfig === "undefined"){
  			config = {rows:10,rowHeight: 120, borderWidth:3};
  		}else{
  			config = flickrConfig;  			
  		}
		$('#fGallery').flickrGallery(config);
  	};  

  	// related posts
  	if($('#related_posts').length > 0){
  		$('#related_posts').relatedPosts({labels:labels,title:'You Might Also Like'});
  	};
  });